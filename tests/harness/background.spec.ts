import { expect, test, type Page } from "@playwright/test";

test.use({
  baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
  viewport: { width: 375, height: 667 },
  isMobile: true,
  hasTouch: true,
});

const canvas = (page: Page) => page.getByTestId("interactive-background");

test.beforeEach(async ({ page }) => {
  await page.goto("/design-preview");
  await expect(canvas(page)).toBeVisible();
  await expect
    .poll(async () => Number(await canvas(page).getAttribute("data-frame-count")))
    .toBeGreaterThan(0);
});

test("mobile contour drawing stays above 28 fps under 4x CPU throttle", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  try {
    await page.waitForTimeout(400);
    const before = Number(await canvas(page).getAttribute("data-frame-count"));
    const start = Date.now();
    await page.waitForTimeout(5000);
    const elapsed = (Date.now() - start) / 1000;
    const after = Number(await canvas(page).getAttribute("data-frame-count"));
    expect((after - before) / elapsed).toBeGreaterThanOrEqual(28);
  } finally {
    await session.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await session.detach();
  }
});

test("a swipe over the canvas scrolls the page", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  try {
    await page.evaluate(() => window.scrollTo(0, 0));
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 175, y: 580 }],
    });
    for (let y = 540; y >= 180; y -= 40) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 175, y }],
      });
      await page.waitForTimeout(16);
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  } finally {
    await session.detach();
  }
});

test("the control over the canvas remains tappable", async ({ page }) => {
  const toggle = page.getByTestId("background-test-button");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(canvas(page)).toHaveCount(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("draws one static image and schedules no further frames", async ({ page }) => {
    await expect(canvas(page)).toHaveAttribute("data-active", "false");
    await page.waitForTimeout(150);
    const before = await canvas(page).getAttribute("data-frame-count");
    await page.waitForTimeout(600);
    expect(await canvas(page).getAttribute("data-frame-count")).toBe(before);
  });
});

test("twenty mount cycles leave no errors or retained heap growth", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const session = await page.context().newCDPSession(page);
  await session.send("Performance.enable");
  const heap = async () => {
    await session.send("HeapProfiler.collectGarbage");
    const { metrics } = await session.send("Performance.getMetrics");
    return metrics.find((metric) => metric.name === "JSHeapUsedSize")?.value ?? 0;
  };
  try {
    const before = await heap();
    const toggle = page.getByTestId("background-test-button");
    for (let cycle = 0; cycle < 20; cycle += 1) {
      await toggle.click();
      await expect(canvas(page)).toHaveCount(0);
      await toggle.click();
      await expect(canvas(page)).toBeVisible();
    }
    const after = await heap();
    expect(errors).toEqual([]);
    expect(after - before).toBeLessThan(6 * 1024 * 1024);
  } finally {
    await session.detach();
  }
});

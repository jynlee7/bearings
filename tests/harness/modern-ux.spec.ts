import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = "http://127.0.0.1:3001/design-preview";

test("bell is discoverable and works with mouse, keyboard, and sound control", async ({ page }) => {
  await page.goto(url);
  await expect(page.locator(".modern-preview")).toHaveAttribute("data-hydrated", "true");
  const bell = page.getByRole("button", { name: "Ring the Campanile bell" });
  await expect(bell).toBeVisible();
  await expect(
    page.getByText("Tap or click the tower. Every ring is a little different."),
  ).toBeVisible();
  await bell.hover();
  await expect(page.getByText("Ring the bell", { exact: true })).toBeVisible();
  await bell.click();
  await expect(page.getByRole("status").filter({ hasText: "Bell melody 1 of 4" })).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(bell).toBeFocused();
  const focusStyle = await bell.evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(Number.parseFloat(focusStyle)).toBeGreaterThanOrEqual(3);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Bell melody 2 of 4" })).toBeVisible();
  const sound = page.getByRole("button", { name: "Sound on" });
  await sound.click();
  await expect(page.getByRole("button", { name: "Sound off" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await bell.click();
  await expect(page.getByRole("status").filter({ hasText: "Bell melody 3 of 4" })).toBeVisible();
});

test("filters, empty state, and dialog have recoverable flows", async ({ page }) => {
  await page.goto(url);
  await expect(page.locator(".modern-preview")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByText("8 places to explore")).toBeVisible();
  await page.getByRole("button", { name: "Nature", exact: true }).click();
  await expect(page.getByText("3 places to explore")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search places" }).fill("no such place");
  await expect(page.getByText("No places found")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText("8 places to explore")).toBeVisible();
  await page
    .getByRole("button", { name: /The Campanile/ })
    .last()
    .click();
  await expect(page.getByRole("dialog", { name: "The Campanile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mobile touch, size, overflow, reduced motion, and accessibility", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"], reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.locator(".modern-preview")).toHaveAttribute("data-hydrated", "true");
  const bell = page.getByRole("button", { name: "Ring the Campanile bell" });
  await bell.tap();
  await expect(page.getByRole("status").filter({ hasText: "Bell melody 1 of 4" })).toBeVisible();
  const metrics = await page.evaluate(() => {
    const tower = document.querySelector(".modern-bell__tower")!.getBoundingClientRect();
    return {
      width: tower.width,
      height: tower.height,
      overflow: document.documentElement.scrollWidth > innerWidth,
      animation: getComputedStyle(document.querySelector(".modern-bell__tower")!).animationDuration,
    };
  });
  expect(metrics.width).toBeGreaterThanOrEqual(44);
  expect(metrics.height).toBeGreaterThanOrEqual(44);
  expect(metrics.overflow).toBe(false);
  expect(metrics.animation).toBe("1e-05s");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
  ).toEqual([]);
  await context.close();
});

for (const viewport of [
  { width: 375, height: 812, name: "mobile" },
  { width: 1280, height: 800, name: "desktop" },
]) {
  test(`capture ${viewport.name} preview`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(url);
    await page.screenshot({ path: `docs/screenshots/modern-${viewport.name}.png`, fullPage: true });
  });
}

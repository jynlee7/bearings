import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000" });

test("preview has no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/design-preview");
  await expect(page.getByTestId("design-preview")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include("[data-testid='design-preview']")
    .analyze();
  const severe = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(severe, JSON.stringify(severe, null, 2)).toEqual([]);
});

test("every preview control is reachable by keyboard and visibly focused", async ({ page }) => {
  await page.goto("/design-preview");
  const controls = page.locator(
    "[data-testid='design-preview'] button:not([disabled]), [data-testid='design-preview'] a[href], [data-testid='design-preview'] input:not([disabled])",
  );
  const expected = await controls.count();
  const reached = new Set<string>();
  for (let index = 0; index < expected + 4; index++) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || !element.closest("[data-testid='design-preview']")) return null;
      const style = getComputedStyle(element);
      const parent = element.parentElement ? getComputedStyle(element.parentElement) : null;
      const hasFocus =
        (style.outlineStyle !== "none" && style.outlineWidth !== "0px") ||
        (parent?.outlineStyle !== "none" && parent?.outlineWidth !== "0px");
      return {
        name: element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName,
        focused: hasFocus,
      };
    });
    if (focused) {
      expect(focused.focused, `Focus indicator missing on ${focused.name}`).toBe(true);
      reached.add(focused.name);
    }
  }
  expect(reached.size).toBe(expected);
});

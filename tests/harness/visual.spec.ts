import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000" });

for (const [size, width, height] of [
  ["mobile", 375, 812],
  ["desktop", 1280, 900],
] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`${size} ${theme} preview screenshot`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/design-preview");
      const preview = page.getByTestId("design-preview");
      await expect(preview).toBeVisible();
      await expect
        .poll(async () =>
          Number(await page.getByTestId("interactive-background").getAttribute("data-frame-count")),
        )
        .toBeGreaterThan(0);
      if (theme === "dark") {
        await page.getByRole("button", { name: "Switch to dark theme" }).click();
      }
      await expect(preview).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      const directory = resolve("docs/screenshots");
      await mkdir(directory, { recursive: true });
      await page.screenshot({
        path: resolve(directory, `preview-${size}-${theme}.png`),
        fullPage: true,
        animations: "disabled",
      });
    });
  }
}

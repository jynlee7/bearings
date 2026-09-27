import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const css = readFileSync(resolve(root, "src/styles/retro-theme.css"), "utf8");
const design = readFileSync(resolve(root, "docs/DESIGN.md"), "utf8");

function blockAfter(marker: string): string {
  const start = css.indexOf(marker);
  if (start < 0) throw new Error(`Missing theme selector: ${marker}`);
  const open = start + marker.length - 1;
  let depth = 1;
  for (let i = open + 1; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`Unclosed theme selector: ${marker}`);
}

function colors(block: string): Map<string, string> {
  return new Map(
    [...block.matchAll(/(--retro-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map(([, name, value]) => [
      name,
      value,
    ]),
  );
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a: string, b: string): number {
  const bright = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (bright + 0.05) / (dark + 0.05);
}

const light = colors(blockAfter(".retro-system {"));
const dark = colors(blockAfter('.retro-system[data-theme="dark"] {'));
const explicitLight = colors(blockAfter('.retro-system[data-theme="light"] {'));
const systemDark = colors(
  blockAfter('.retro-system:not([data-theme="light"]):not([data-theme="dark"]) {'),
);
const failures: string[] = [];

for (const [mode, expected, actual] of [
  ["explicit light", light, explicitLight],
  ["system dark", dark, systemDark],
] as const) {
  for (const [token, value] of expected) {
    if (actual.get(token) !== value) {
      failures.push(`${mode}: ${token} differs from its base palette`);
    }
  }
}

const table = design.split("## Approved contrast pairings")[1]?.split("## Type and spacing")[0];
if (!table) throw new Error("DESIGN.md has no approved contrast pairings table");
const pairings = [
  ...table.matchAll(
    /^\|\s*`(--retro-[\w-]+)`\s*\|\s*`(--retro-[\w-]+)`\s*\|\s*(body|large|ui)\s*\|/gm,
  ),
];
if (pairings.length === 0) throw new Error("No machine-readable contrast pairings found");

for (const [themeName, palette] of [
  ["light", light],
  ["dark", dark],
] as const) {
  for (const [, foreground, background, type] of pairings) {
    const fg = palette.get(foreground);
    const bg = palette.get(background);
    if (!fg || !bg) {
      failures.push(`${themeName}: missing ${!fg ? foreground : background}`);
      continue;
    }
    const ratio = contrast(fg, bg);
    const minimum = type === "body" ? 4.5 : 3;
    if (ratio < minimum) {
      failures.push(
        `${themeName}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1; needs ${minimum}:1`,
      );
    }
  }
}

if (failures.length) {
  console.error(`Contrast harness failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Contrast harness passed: ${pairings.length} pairings in light and dark themes.`);
}

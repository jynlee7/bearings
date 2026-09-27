import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const runGit = (...args: string[]) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const failures: string[] = [];

if (runGit("branch", "--show-current") !== "design/retro-system") {
  failures.push("Run this check on design/retro-system.");
}

const base =
  process.env["BEARINGS_HARNESS_BASE"] ?? runGit("merge-base", "HEAD", "claude/v1-harness");
const branchFiles = runGit("diff", "--name-only", base).split("\n").filter(Boolean);
const untracked = runGit("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
const files = new Set([...branchFiles, ...untracked]);

const allowed = (file: string) =>
  file === "AGENTS.md" ||
  file === "docs/DESIGN.md" ||
  file.startsWith("docs/reference/") ||
  file.startsWith("docs/screenshots/") ||
  file === "scripts/harness/check-no-copying.ts" ||
  file === "scripts/harness/check-contrast.ts" ||
  file === "scripts/harness/check-boundaries.ts" ||
  file === "src/styles/retro-theme.css" ||
  file === "src/components/retro/InteractiveBackground.tsx" ||
  file === "src/lib/noise.ts" ||
  (file.startsWith("src/components/retro/") &&
    file !== "src/components/retro/InteractiveBackground.tsx") ||
  file === "src/pages/DesignPreview.tsx" ||
  file === "src/routes/design-preview.tsx" ||
  file === "src/routeTree.gen.ts" ||
  file.startsWith("tests/components/") ||
  file === "tests/harness/background.spec.ts" ||
  file === "tests/harness/visual.spec.ts" ||
  file === "package.json";

for (const file of files) {
  if (file === ".gitignore") {
    const diff = runGit("diff", "--unified=0", base, "--", file);
    const changedLines = diff.split("\n").filter((line) => /^[+-][^+-]/.test(line));
    if (changedLines.length === 1 && changedLines[0] === "+reference/*") continue;
  }
  if (!allowed(file)) failures.push(`Outside agent boundaries: ${file}`);
  if (/^(supabase\/|migrations\/|edge-functions\/)/.test(file)) {
    failures.push(`Protected application data path changed: ${file}`);
  }
}

if (files.has("package.json")) {
  const before = JSON.parse(runGit("show", `${base}:package.json`)) as Record<string, unknown>;
  const after = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (key === "scripts" || key === "devDependencies") continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      failures.push(`package.json changed outside scripts/devDependencies: ${key}`);
    }
  }
}

if (files.has("src/routeTree.gen.ts")) {
  const diff = runGit("diff", "--unified=0", base, "--", "src/routeTree.gen.ts");
  if (diff.split("\n").some((line) => /^-[^-]/.test(line))) {
    failures.push("Generated route tree removed existing route content.");
  }
  if (!diff.includes("design-preview")) {
    failures.push("Generated route tree changed without the preview route.");
  }
}

if (failures.length) {
  console.error(`Boundary harness failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Boundary harness passed: ${files.size} branch and working-tree files checked.`);
}

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const reference = ["reference/berkeleytime", "reference/berkelytime"]
  .map((path) => join(root, path))
  .find(existsSync);

if (!reference) {
  console.error("No Berkeleytime reference directory found.");
  process.exit(1);
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : entry.isFile() ? [path] : [];
  });
}

function git(args: string[]): string[] {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
}

const base = git(["merge-base", "HEAD", "main"])[0];
const changed = git(["diff", "--name-only", "--diff-filter=A", base, "--", "src/"]);
const untracked = git(["ls-files", "--others", "--exclude-standard", "--", "src/"]);
const newFiles = [...new Set([...changed, ...untracked])]
  .map((path) => join(root, path))
  .filter((path) => existsSync(path) && statSync(path).isFile());
const referenceFiles = walk(reference);
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".scss",
  ".html",
  ".json",
  ".svg",
  ".txt",
  ".md",
]);
const assetExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp3",
  ".mp4",
  ".svg",
]);

const referenceTexts = referenceFiles
  .filter((path) => textExtensions.has(extname(path).toLowerCase()))
  .map((path) => ({ path, text: readFileSync(path, "utf8") }));

const lineRuns = new Map<string, string>();
for (const { path, text } of referenceTexts) {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  for (let index = 0; index <= lines.length - 10; index++) {
    const window = lines.slice(index, index + 10);
    if (window.every((line) => line.trim() === "")) continue;
    lineRuns.set(window.join("\n"), `${relative(root, path)}:${index + 1}`);
  }
}

function cssRules(css: string): Map<string, string> {
  const rules = new Map<string, string>();
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(pattern)) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    const declarations = match[2].trim().replace(/\s+/g, " ");
    if (!declarations || !declarations.includes(":")) continue;
    // Compare the complete rule. A generic single declaration is not evidence of copying.
    rules.set(`${selector}{${declarations}}`, selector);
  }
  return rules;
}

const referenceRules = new Map<string, string>();
const referenceClasses = new Set<string>();
for (const { path, text } of referenceTexts.filter(({ path }) => extname(path) === ".css")) {
  for (const [rule] of cssRules(text)) referenceRules.set(rule, relative(root, path));
  for (const match of text.matchAll(/(?<![\w-])\.([_a-zA-Z][\w-]*)/g)) {
    referenceClasses.add(match[1]);
  }
}

const assetHashes = new Map<string, string>();
for (const path of referenceFiles.filter((file) =>
  assetExtensions.has(extname(file).toLowerCase()),
)) {
  assetHashes.set(
    createHash("sha256").update(readFileSync(path)).digest("hex"),
    relative(root, path),
  );
}

const failures: string[] = [];
for (const path of newFiles) {
  const label = relative(root, path);
  const extension = extname(path).toLowerCase();
  const bytes = readFileSync(path);
  if (assetExtensions.has(extension)) {
    const source = assetHashes.get(createHash("sha256").update(bytes).digest("hex"));
    if (source) failures.push(`${label}: asset is identical to ${source}`);
  }
  if (!textExtensions.has(extension)) continue;

  const text = bytes.toString("utf8");
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  for (let index = 0; index <= lines.length - 10; index++) {
    const source = lineRuns.get(lines.slice(index, index + 10).join("\n"));
    if (source) failures.push(`${label}:${index + 1}: ten matching lines from ${source}`);
  }

  if (extension === ".css" || extension === ".scss") {
    for (const [rule, selector] of cssRules(text)) {
      const source = referenceRules.get(rule);
      if (source) failures.push(`${label}: CSS rule ${selector} matches ${source}`);
    }
  }

  // Reference CSS uses distinctive generated and utility names. Check literal class
  // tokens in source without treating ordinary words in prose as class names.
  const classValues = [
    ...text.matchAll(/\bclass(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g),
    ...text.matchAll(/\bclassName\s*:\s*["'`]([^"'`]+)["'`]/g),
  ];
  const declaredClasses =
    extension === ".css" || extension === ".scss"
      ? [...text.matchAll(/(?<![\w-])\.([_a-zA-Z][\w-]*)/g)].map((match) => match[1])
      : [];
  const usedClasses = [
    ...classValues.flatMap((match) => match[1].split(/\s+/)),
    ...declaredClasses,
  ];
  for (const className of new Set(usedClasses)) {
    if (referenceClasses.has(className))
      failures.push(`${label}: class name ${className} appears in the reference CSS`);
  }
}

if (failures.length) {
  console.error(`Copying check failed (${failures.length} finding(s)):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(
  `Copying check passed: ${newFiles.length} new src file(s) compared with ${referenceFiles.length} reference file(s).`,
);

import { readFileSync } from "node:fs";

const report = readFileSync(new URL("../../docs/research/ux-review.md", import.meta.url), "utf8");
const required = [
  "## What the current PR shows",
  "## Research-backed decisions",
  "## Questions for user research",
  "### Review rubric",
  "## Improvement backlog",
];
for (const section of required) {
  if (!report.includes(section)) throw new Error(`UX research is missing ${section}`);
}
const sources = [
  ...report.matchAll(
    /https:\/\/(?:www\.)?(?:w3\.org|developer\.mozilla\.org|baymard\.com)\/[^)]+/g,
  ),
];
if (sources.length < 5) throw new Error("UX research needs at least five primary sources");
if (!report.includes("moderated comparison") || !report.includes("Randomize"))
  throw new Error("Include a real-user comparison plan");
console.log(`UX research report: ${required.length} sections, ${sources.length} source links`);

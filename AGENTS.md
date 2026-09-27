<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Retro design system agent contract

Work on `design/retro-system`. Treat the Berkeleytime reference as read only. Study its UX, but never copy code, CSS, class names, colors, assets, or branding. Preserve published Git history. Keep existing pages, Supabase, migrations, and edge functions untouched.

Run Agent 1 first. Agents 2, 3, and 4 may run in parallel after Agent 1; Agent 5 runs last. Each agent runs its harness, fixes failures, and reruns it up to three attempts. Report any failure remaining after attempt three. `npm run harness` runs the full sequence.

## Agent 1 — Reference Analyst

Read `reference/berkeleytime/` and write `docs/reference/berkeleytime-analysis.md` with UX patterns worth adopting, patterns to avoid, and adaptations for Bearings, in original prose without reference code or CSS snippets. The checked out reference may be named `reference/berkelytime/`; use that directory when present.

Allowed files: `docs/reference/`, `scripts/harness/check-no-copying.ts`.

Harness: `scripts/harness/check-no-copying.ts` compares every new file in `src/` with the reference and fails on a matching run of 10 or more lines, identical CSS rule blocks, copied class names, or copied asset files.

## Agent 2 — Design System Architect

Use the analysis to write `docs/DESIGN.md` with palette hex values, type scale, spacing, borders, shadows, motion, and accessibility rules. Build `src/styles/retro-theme.css` with all tokens as CSS custom properties, light and dark themes via `prefers-color-scheme`, and a `[data-theme]` override. In `tailwind.config`, only add entries under `theme.extend`.

Allowed files: `docs/DESIGN.md`, `src/styles/retro-theme.css`, `tailwind.config` (additions under `theme.extend` only), `scripts/harness/check-contrast.ts`.

Harness: `scripts/harness/check-contrast.ts` reads the tokens and fails any text/background pairing listed in `DESIGN.md` below WCAG AA: 4.5:1 for body text, 3:1 for large text and UI elements, in both themes.

## Agent 3 — Background Engineer

Build `src/components/retro/InteractiveBackground.tsx`: a canvas of animated topographic contours from noise that ripple away from pointer and touch. The canvas has `pointer-events: none`; window listeners are passive and never call `preventDefault`. Use reduced resolution and a 30 fps cap on mobile, 60 fps on desktop. Pause when the tab is hidden or the canvas is offscreen, clean up on unmount, and draw a static version for `prefers-reduced-motion`. Provide intensity, color scheme, and off props. Use no heavy libraries.

Allowed files: `src/components/retro/InteractiveBackground.tsx`, `src/lib/noise.ts`, `tests/harness/background.spec.ts`.

Harness: `tests/harness/background.spec.ts` (Playwright) measures frame rate for five seconds at 375 px with 4x CPU throttle and fails below 28 fps; confirms a touch swipe scrolls the page, an overlaid button can be tapped, reduced motion runs no animation frames, and 20 mount/unmount cycles cause no errors or memory growth.

## Agent 4 — Component Builder

Build `SightingCard` (name, category badge, XP, distance, visited/unvisited state, illustration slot), `FeaturedSightings` (horizontal mobile scroll, desktop grid), `SearchBar` with category chips, `RetroButton`, `RetroBadge`, segmented `XPBar`, and `LevelBadge` in `src/components/retro/`. Build `src/pages/DesignPreview.tsx` with about eight mock Berkeley places over the background, light/dark and background toggles. Add one preview route only.

Allowed files: `src/components/retro/` except `InteractiveBackground.tsx`, `src/pages/DesignPreview.tsx`, the router file (one added route only), `tests/components/`.

Harness: Vitest and React Testing Library tests for every component and state; axe-core preview scan with zero serious or critical violations; keyboard navigation proving every interactive element is reachable and has visible focus; TypeScript and lint with no errors.

## Agent 5 — QA Integrator

Run all harnesses above, the existing build and tests, `scripts/harness/check-boundaries.ts`, and `tests/harness/visual.spec.ts`. The boundary check compares this branch's Git diff to these allowed file lists and fails for out-of-bound changes or changes to Supabase, migrations, edge functions, or existing pages. Capture preview screenshots at 375 px and 1280 px in light and dark mode in `docs/screenshots/`. Review against `DESIGN.md`; fix small issues and return larger ones to the responsible agent. Add `npm run harness` to run all harnesses in order.

Allowed files: `scripts/harness/check-boundaries.ts`, `tests/harness/visual.spec.ts`, `docs/screenshots/`, `package.json` (scripts and dev dependencies only).

## Finish

Open a pull request with the screenshots, a summary of each agent's work, every harness result, any failure after three attempts, and decisions for user review.

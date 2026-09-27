# Berkeleytime UX analysis for Bearings

The checked out reference is a bundled page and stylesheet in `reference/berkelytime/`. This analysis describes interaction and layout patterns visible in that bundle. It is guidance for an original Bearings design, not a visual template.

## Patterns worth adopting

| Reference pattern | Why it works | Bearings adaptation |
| --- | --- | --- |
| A clear split between primary destinations and the content within each destination | People can enter a large information space without learning its full structure first. | Make Sightings the main destination, with secondary paths to map, progress, and saved places. Keep the preview focused on discovering places. |
| Search close to the results it changes | The relationship between a query and the resulting list stays obvious. | Put a prominent place search immediately above the Sighting collection; update cards in place and show a useful empty state. |
| Faceted narrowing alongside text search | A broad query becomes manageable without requiring exact terminology. | Use a small set of place categories as tappable chips, with one active state and an easy way back to all places. Avoid deep filter menus for the initial collection. |
| Scannable rows and cards with repeated field positions | Dense information remains comparable because the eye learns where each field lives. | Give every Sighting card the same order: place name, category, distance, XP, and visited status. Use short labels and align numeric metadata consistently. |
| Compact controls with visible selected states | Users can scan, choose, and revise filters quickly. | Use high contrast chip states and pressed feedback. Preserve generous touch targets even when the visual treatment is compact. |
| Persistent navigation and controlled overlays | Navigation stays available while a large result set scrolls. | Use a compact mobile navigation pattern and keep filters within the page. An overlay, if added later, should retain a clear close action and restore focus. |
| Responsive shifts from full navigation to a smaller menu | The interface keeps core actions available at narrow widths. | Let featured cards scroll horizontally at phone widths and become a grid on larger screens. Keep search and category selection visible without forcing a desktop sidebar onto mobile. |
| Restrained spacing and type hierarchy | The page fits many choices without making each one feel equally loud. | Use a readable body face, a small number of type sizes, and stable spacing increments. Reserve pixel type and brighter colors for headings, badges, and progress cues. |

## What to avoid

- Do not reproduce the reference's academic information architecture, terminology, branded marks, palette, typography, component shapes, CSS, or assets. Exploration has a different task model from course planning.
- Do not compress cards until names, visited state, or tap targets become hard to read. Information density should come from consistent placement and concise copy.
- Do not hide the first useful results behind a large decorative hero. Featured Sightings should be the first substantial content on the home experience.
- Do not let motion compete with filtering or scrolling. The contour background is ambient, sits behind content, and becomes static for reduced motion.
- Do not rely on color alone to distinguish selected filters or visited places. Pair color with text, shape, or an explicit status label.
- Do not make horizontal mobile content the only way to find a place. Search, category filtering, and an accessible list or grid should continue to expose the full collection.

## Layout and mobile guidance

Start with a narrow reading column for introductory copy, then give the Sighting collection enough width to show its metadata. Keep a predictable vertical rhythm: section heading, short supporting line, search and filters, then results. On phones, show a clear edge of the next featured card to advertise horizontal scrolling; on wider screens, use a regular grid so comparison is easier. Search and controls should fit a thumb but retain keyboard focus styles. Any full-screen background must leave scrolling and taps to the foreground controls.

## Originality boundary

Only the general UX lessons above should transfer. Bearings' trail-map theme, names, token values, component markup, implementation, and illustrations must be created independently. The copying harness checks new `src/` files against the checked out reference for long identical text runs, identical CSS rules, reference class names, and duplicate assets.

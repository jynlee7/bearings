# Bearings retro trail system

This visual system gives place discovery the feel of a pocket trail guide and a handheld game. Featured Sightings are the first substantial content. Search and category filters sit immediately above the places they change. Each card repeats the same information order so several places can be compared quickly. The contour background is ambient and remains behind the controls.

Use the scoped `.retro-system` class on the preview root and import `src/styles/retro-theme.css`. Set `data-theme="light"` or `data-theme="dark"` on that root for an explicit choice; without an override the system follows `prefers-color-scheme`. Existing pages retain their current theme.

## Palette

| Role and CSS token | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper `--retro-paper` | `#F6F0DE` | `#132238` | Full page and quiet empty areas |
| Surface `--retro-surface` | `#FFFAF0` | `#20334B` | Cards and control groups |
| Raised `--retro-raised` | `#FFFFFF` | `#2A405A` | Inputs and elevated details |
| Ink `--retro-ink` | `#19283B` | `#F7F0DE` | Main text |
| Muted ink `--retro-muted-ink` | `#455467` | `#C4D0D6` | Secondary text |
| Gold `--retro-gold` | `#F2C14D` | `#F2C14D` | XP, primary action, active filters |
| Gold ink `--retro-gold-ink` | `#19283B` | `#19283B` | Text on gold |
| Forest `--retro-forest` | `#315B49` | `#A8C7A7` | Visited and nature category |
| Forest ink `--retro-forest-ink` | `#FFFAF0` | `#132238` | Text on forest |
| Brick `--retro-brick` | `#93443A` | `#E8A18C` | Landmark accents |
| Brick ink `--retro-brick-ink` | `#FFFAF0` | `#132238` | Text on brick |
| Sky `--retro-sky` | `#B9DCE9` | `#AED8E7` | Water and discovery accents |
| Sky ink `--retro-sky-ink` | `#19283B` | `#132238` | Text on sky |
| Border `--retro-border` | `#19283B` | `#F7F0DE` | 2 px outlines and controls |
| Focus `--retro-focus` | `#315B49` | `#F2C14D` | Keyboard focus outline |
| Contour `--retro-contour` | `#78918D` | `#607D88` | Decorative background only |

The light and dark palettes each have a clear main text color. Accent fills always use their matching ink token. Contour color is decorative and must never carry information.

## Approved contrast pairings

The token names in this table are checked in both themes by `scripts/harness/check-contrast.ts`. Body text needs at least 4.5:1. Large text (at least 18 pt regular or 14 pt bold) and non-text UI boundaries need at least 3:1.

| Foreground token | Background token | Type | Purpose |
| --- | --- | --- | --- |
| `--retro-ink` | `--retro-paper` | body | Page copy |
| `--retro-ink` | `--retro-surface` | body | Card headings and details |
| `--retro-ink` | `--retro-raised` | body | Input text |
| `--retro-muted-ink` | `--retro-paper` | body | Supporting copy |
| `--retro-muted-ink` | `--retro-surface` | body | Card metadata |
| `--retro-gold-ink` | `--retro-gold` | body | XP and primary controls |
| `--retro-forest-ink` | `--retro-forest` | body | Visited status |
| `--retro-brick-ink` | `--retro-brick` | body | Landmark badge |
| `--retro-sky-ink` | `--retro-sky` | body | Discovery badge |
| `--retro-border` | `--retro-paper` | ui | Card and control outlines |
| `--retro-border` | `--retro-surface` | ui | Inner control outlines |
| `--retro-focus` | `--retro-paper` | ui | Focus ring on page |
| `--retro-focus` | `--retro-surface` | ui | Focus ring on cards |

## Type and spacing

The pixel stack is `Silkscreen`, `Courier New`, monospace. Use it for short headings, category badges, level labels, and XP figures. Body and controls use `Nunito`, `Trebuchet MS`, Arial, sans-serif. Pixel letters should not be used for paragraphs, long place names, or form input.

The type scale is 12, 14, 16, 20, and 24 px, with a fluid display size from 28 to 48 px. Body line height is 1.5; heading line height is 1.2. Keep important controls and card names at 16 px or above. Use spacing steps of 4, 8, 12, 16, 20, 24, 32, and 48 px. On phones, use 16 px page gutters and 24–32 px between major sections. On wider screens, use 24–32 px gutters and at most 48 px between sections. The spacing should let featured places appear near the top of the viewport.

## Shape, depth, and motion

Cards and buttons use 2 px solid borders, 4 px corners, and a 4 px hard offset shadow. Hover may shift the shadow or translate a control by 1 px. Pressed controls translate by the full shadow offset and lose the shadow. These states must leave text legible and should not change layout around the control.

Control transitions take 120 ms; larger surface changes take 200 ms with the `--retro-easing` curve. Keep contour movement slow and low contrast. The background may respond to mouse and touch movement, but it must never intercept gestures or clicks. At reduced motion, draw one static contour image and remove decorative transitions.

## Accessibility and responsive behavior

- Every interactive target is at least 44 by 44 px, including filter chips and icon controls.
- Visible focus uses a 3 px outline with 3 px offset. The outline must remain visible against its immediate surface.
- Selected filters and visited status use text plus visual treatment; color alone is insufficient.
- Search has a persistent label or accessible name. Filter chips expose their selected state.
- Horizontal featured cards show a partial next card on phones, support touch and keyboard scrolling, and become a grid on larger screens. Search and filtering still expose the full collection.
- Maintain the approved pairings above when new surfaces or badges are added. Do not place body text directly on the contour background.
- Respect reduced motion, system color preference, and explicit light/dark selection. Decorative canvas content stays hidden from assistive technology.

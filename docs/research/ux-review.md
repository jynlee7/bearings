# Bearings comparison preview: UX research and evaluation harness

## What the current PR shows

Reviewed `design/retro-system` at commit `082af03`, including its desktop and mobile light/dark screenshots and preview source. It offers eight Berkeley places, search and category chips, card details, progress, a theme switch, and animated contour lines. The new comparison branch starts from `main` and keeps the same eight example destinations, search, and categories so reviewers can compare the interaction and visual direction rather than a different content set.

The retro preview has a strong identity, but its contour animation is decorative and its Campanile appears only as a generic tower icon on a card. The large all-caps pixel typography and dense card framing make the first screen feel more like a themed game than a welcoming invitation to explore. This is a design hypothesis from reviewing the preview, not a measured user preference.

## Research-backed decisions

| Principle | Evidence | Applied in this preview | Harness check |
| --- | --- | --- | --- |
| Make primary actions usable on touch and keyboard | [WCAG 2.2 target size and focus criteria](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/); [WAI focus technique](https://www.w3.org/WAI/WCAG22/Techniques/general/G195) | The tower is a real button. Its visible instruction explains tapping and clicking; hover only adds a cue. Focus has a strong outline. | Keyboard activation, touch activation, focus, and target size. |
| Let users control sound and avoid unexpected playback | [MDN Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API); [MDN autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) | Bell audio starts only after activation. A sound toggle stays visible. Each activation advances through four short synthesized melodies. | No audio context before activation; successive status messages; sound toggle. |
| Respect motion preferences | [WCAG animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | The bell keeps its function while `prefers-reduced-motion` removes its pulse and hover movement. | Reduced-motion computed style. |
| Keep search and category state clear | [Baymard filter guidance](https://baymard.com/blog/ecommerce-filter-ui) | Selected chips use a persistent state, a result count updates, and an empty state offers a clear reset. These are adapted from shopping research to place discovery; the effect should be checked with real users. | Filter, count, and clear behavior. |
| Make controls readable | [WCAG 2.2 contrast requirements](https://www.w3.org/TR/WCAG22/#contrast-minimum) | The preview uses dark copy on light surfaces and clear primary controls. | Automated serious/critical axe scan plus visual review. |

## Questions for user research

Run a short moderated comparison with at least five Berkeley newcomers on a phone and laptop. Randomize which preview they see first. Give each person the same tasks: find a nature place, find the Campanile, ring the bell, mute it, and explain how they would check in. Do not teach the bell interaction. Record task completion, time to first place, whether the bell is discovered, errors, and a one-question preference with a reason. Include people who navigate by keyboard and people who prefer reduced motion where possible. [Nielsen Norman Group recommends around five participants for a qualitative usability study](https://www.nngroup.com/articles/how-many-test-users/); the results should guide iteration rather than be presented as statistically representative.

### Review rubric

Score each category from 0 to 2 (`0` blocked, `1` friction, `2` clear):

1. Purpose and next step are understood within five seconds.
2. Search and filters show their state and recover from no results.
3. Bell affordance is discoverable without hover.
4. Bell is usable by mouse, touch, and keyboard; sound is optional.
5. Mobile layout avoids sideways page scrolling and tiny targets.
6. Focus, contrast, dialog behavior, and reduced motion support access.
7. Place details and check-in route are understandable.

The browser harness covers observable behavior for categories 2–6. Categories 1 and 7 require the moderated tasks above. Keep both automated results and participant observations with screenshots when deciding which PR to land.

## Improvement backlog

1. Replace the mock places with real location and visit data after choosing a direction.
2. Validate whether the tower interaction draws attention to exploration or distracts from it; keep or simplify it based on task outcomes.
3. Add actual Campanile bell recordings only after confirming licensing and testing volume across devices. The current synthesized tones are deliberately generic and do not claim to reproduce the real bells.
4. Test copy with Berkeley students and visitors, especially the meaning of XP and check-in.

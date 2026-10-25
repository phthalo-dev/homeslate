---
"@homeslate/widgets": minor
"@homeslate/display": minor
"@homeslate/editor": minor
"@homeslate/host-react": minor
---

Move to `@var-ui/*` 0.2 and `typestyles` 0.32. Apps that use these packages need the same versions (`typestyles` must be exactly 0.32.1, the version var-ui depends on, so there is one style registry).

- Buttons use `tone` + `appearance` instead of the removed `intent`.
- Themes are built as children of var-ui's default theme: `colorMode` and `extend` in a theme document are converted to `{ light, dark }` token leaves.
- `useDebouncedValue` and `useElementSize`, which var-ui dropped, are now exported from `@homeslate/widgets`.

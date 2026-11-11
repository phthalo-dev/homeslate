---
"@homeslate/widgets": minor
"@homeslate/display": minor
"@homeslate/editor": minor
"@homeslate/host-react": minor
---

Move to `@var-ui/core` 0.9, `@var-ui/react` 0.9, `@var-ui/astro` 0.6, `@var-ui/docs` 0.3, `@var-ui/icons` 0.3, and `typestyles` 0.35, with every version pinned in the workspace catalog so all packages resolve one style registry.

This rolls up the 0.2 → 0.9 migration, which drops the `is*`/`selectedKey` prop vocabulary and the app-level overlay portal:

- `onPress` → `onClick`, `isDisabled` → `disabled`, `isPending` → `loading`, `isRequired` → `required`.
- `onChange` → `onValueChange` for text, number, slider, calendar, and color fields; sliders use `onValueCommit` for the end of a drag.
- `isSelected` → `checked` / `onCheckedChange` for checkbox and switch; `selected` / `onSelectedChange` for toggle buttons and chips.
- `selectedKey` / `onSelectionChange` → `value` / `onValueChange`; `SegmentedControl` now takes a single value instead of a key set.
- Option and tab definitions use `{ value, label }` instead of `{ id, label }`.
- `SimpleTooltip` is replaced by the `Tooltip.Root` / `Tooltip.Trigger` / `Tooltip.Popup` compound, and `SimpleGrid` by `Grid`.
- `Dialog.Backdrop` is gone, and no overlay accepts `portalContainer`. `@homeslate/widgets` no longer exports `OverlayPortalContext` / `useOverlayPortalContainer`, since overlays no longer need a host element.
- `Alert` uses `tone` instead of `variant`, `Collapsible` uses `expanded` instead of `isExpanded`, `PinInput` uses `characters` instead of `type`, and `AppShell` `contentPadding` takes a space token instead of a number.
- `LayerProvider` is gone from `@var-ui/react`; apps no longer wrap the tree in it.

Our own component APIs follow the same vocabulary, so `TemplatePicker` from `@homeslate/host-react` takes `open` / `loading` instead of `isOpen` / `isPending`. `@homeslate/widgets` keeps exporting `useDebouncedValue`, now re-exported from `@var-ui/react` instead of a local copy.

`@homeslate/widgets`, `@homeslate/display`, and `@homeslate/editor` also return to the 0.x line: their packages are still settling, so this release is `0.2.0` rather than `1.4.0` / a major. The `1.x` versions stay on npm, but new work lands on 0.x.

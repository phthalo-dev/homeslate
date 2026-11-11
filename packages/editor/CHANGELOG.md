# @homeslate/editor

## 0.2.0

### Minor Changes

- [#52](https://github.com/phthalo-dev/homeslate/pull/52) [`ce1a9b4`](https://github.com/phthalo-dev/homeslate/commit/ce1a9b46b6b2f48670a0d432519754e1a6f1d6aa) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Move to `@var-ui/core` 0.9, `@var-ui/react` 0.9, `@var-ui/astro` 0.6, `@var-ui/docs` 0.3, `@var-ui/icons` 0.3, and `typestyles` 0.35, with every version pinned in the workspace catalog so all packages resolve one style registry.
  
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

### Patch Changes

- Updated dependencies [[`ce1a9b4`](https://github.com/phthalo-dev/homeslate/commit/ce1a9b46b6b2f48670a0d432519754e1a6f1d6aa), [`ce1a9b4`](https://github.com/phthalo-dev/homeslate/commit/ce1a9b46b6b2f48670a0d432519754e1a6f1d6aa), [`a01b4fe`](https://github.com/phthalo-dev/homeslate/commit/a01b4fed63aeb389125a45783eccd3e6e2ff4430), [`ce1a9b4`](https://github.com/phthalo-dev/homeslate/commit/ce1a9b46b6b2f48670a0d432519754e1a6f1d6aa), [`4f692a9`](https://github.com/phthalo-dev/homeslate/commit/4f692a9d5cd7e34e7ecc0d873353c35176c6f810)]:
  - @homeslate/display@0.2.0
  - @homeslate/schema@0.1.3
  - @homeslate/widgets@0.2.0

## 1.1.0

### Minor Changes

- [#48](https://github.com/phthalo-dev/homeslate/pull/48) [`07182e9`](https://github.com/phthalo-dev/homeslate/commit/07182e9823ae7ca9febd0eefca8f47f423dce80a) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Move to `@var-ui/*` 0.2 and `typestyles` 0.32. Apps that use these packages need the same versions (`typestyles` must be exactly 0.32.1, the version var-ui depends on, so there is one style registry).
  
  - Buttons use `tone` + `appearance` instead of the removed `intent`.
  - Themes are built as children of var-ui's default theme: `colorMode` and `extend` in a theme document are converted to `{ light, dark }` token leaves.
  - `useDebouncedValue` and `useElementSize`, which var-ui dropped, are now exported from `@homeslate/widgets`.

### Patch Changes

- [#47](https://github.com/phthalo-dev/homeslate/pull/47) [`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Error messages now render in the danger color: `<Text tone="danger">` was ignored by var-ui, so they appeared as plain text. `@homeslate/widgets` exports an `ErrorText` component for this (until var-ui adds a `danger` tone). The "remove" button in the entity picker now shows its icon. Type errors across the packages are fixed and TypeScript errors now fail CI.
- Updated dependencies [[`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0), [`07182e9`](https://github.com/phthalo-dev/homeslate/commit/07182e9823ae7ca9febd0eefca8f47f423dce80a)]:
  - @homeslate/widgets@1.3.0
  - @homeslate/display@1.2.0

## 1.0.2

### Patch Changes

- a7f67a8: Point the repository metadata at the phthalo-dev GitHub organization.
- Updated dependencies [f016429]
- Updated dependencies [6d33084]
- Updated dependencies [8b0fe7a]
- Updated dependencies [6a7c289]
- Updated dependencies [7924794]
- Updated dependencies [43e2d43]
- Updated dependencies [24dd8a8]
- Updated dependencies [d7ce792]
- Updated dependencies [38cbc67]
- Updated dependencies [8b0fe7a]
- Updated dependencies [ccd45bc]
- Updated dependencies [a7f67a8]
- Updated dependencies [b16106e]
- Updated dependencies [6ebdf88]
  - @homeslate/display@1.1.0
  - @homeslate/widgets@1.2.0
  - @homeslate/schema@1.1.0

## 1.0.1

### Patch Changes

- Updated dependencies [d0bcb9e]
  - @homeslate/widgets@1.1.0
  - @homeslate/display@1.0.1

## 1.0.0

### Major Changes

- 9fe796d: Remove Mantine. Theme documents are VarUI-shaped (`createDesignTheme` JSON). Hosts must follow the README contract: one TypeStyles extract of `@var-ui/core/styles` then `@homeslate/*/styles`, one `DesignSystemProvider` with `applyToDocument` on full-page routes, plus `IconProvider` and `LayerProvider`. `Editor` and `Display` nest their own provider and must not call `applyToDocument`.

### Minor Changes

- d010d08: Replace CSS modules with TypeStyles. Hosts can extract `@homeslate/*/styles` with `@typestyles/vite`; without the plugin, styles still inject at runtime.

### Patch Changes

- Updated dependencies [79fd3ae]
- Updated dependencies [d010d08]
- Updated dependencies [9fe796d]
- Updated dependencies [25def83]
  - @homeslate/widgets@1.0.0
  - @homeslate/display@1.0.0
  - @homeslate/schema@1.0.0

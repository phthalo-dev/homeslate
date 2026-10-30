# @homeslate/host-react

## 0.3.1

### Patch Changes

- Updated dependencies [[`4f692a9`](https://github.com/phthalo-dev/homeslate/commit/4f692a9d5cd7e34e7ecc0d873353c35176c6f810)]:
  - @homeslate/widgets@1.3.1
  - @homeslate/display@1.2.1
  - @homeslate/editor@1.1.1

## 0.3.0

### Minor Changes

- [#48](https://github.com/phthalo-dev/homeslate/pull/48) [`07182e9`](https://github.com/phthalo-dev/homeslate/commit/07182e9823ae7ca9febd0eefca8f47f423dce80a) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Move to `@var-ui/*` 0.2 and `typestyles` 0.32. Apps that use these packages need the same versions (`typestyles` must be exactly 0.32.1, the version var-ui depends on, so there is one style registry).
  
  - Buttons use `tone` + `appearance` instead of the removed `intent`.
  - Themes are built as children of var-ui's default theme: `colorMode` and `extend` in a theme document are converted to `{ light, dark }` token leaves.
  - `useDebouncedValue` and `useElementSize`, which var-ui dropped, are now exported from `@homeslate/widgets`.

### Patch Changes

- [#47](https://github.com/phthalo-dev/homeslate/pull/47) [`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Error messages now render in the danger color: `<Text tone="danger">` was ignored by var-ui, so they appeared as plain text. `@homeslate/widgets` exports an `ErrorText` component for this (until var-ui adds a `danger` tone). The "remove" button in the entity picker now shows its icon. Type errors across the packages are fixed and TypeScript errors now fail CI.
- Updated dependencies [[`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0), [`07182e9`](https://github.com/phthalo-dev/homeslate/commit/07182e9823ae7ca9febd0eefca8f47f423dce80a)]:
  - @homeslate/widgets@1.3.0
  - @homeslate/editor@1.1.0
  - @homeslate/display@1.2.0

## 0.2.0

### Minor Changes

- f016429: Isolate widget and route crashes, and add the display copy and starter-layout tools.
  
  - **`@homeslate/display`** — a widget error boundary keeps one crash from blanking
    the board. Displays and views can be duplicated or exported as JSON, and new
    boards can start from Family Hub, Kitchen, Home Control, or Photo Frame.
  - **`@homeslate/host-react`** — kiosk and editor routes show a reload fallback
    instead of a white screen. The display list can import, duplicate, and start
    from a template without overwriting an existing display.
  - **`@homeslate/server`** — the Home Assistant image proxy also allows person
    images (`/api/image/…`) and `www` assets (`/local/…`).
  - **`@homeslate/widgets`** — presence avatars load through that proxy and fall
    back to initials when the picture is missing or fails.
- 6d33084: Keep a kiosk usable when the network drops, and show when the data on screen is stale.
  
  - **`@homeslate/widgets`** — remote widget data is cached and revalidated in the background. Stale reads stay on screen, and unlock/disarm waits for a fresh security state. Weather, news, sports, calendars, and stocks are loaded through the Homeslate server.
  - **`@homeslate/server`** — those reads are proxied by the API. Stock quotes use `FINNHUB_API_KEY` on the server instead of a key stored in the display.
  - **`@homeslate/host-react`** — the kiosk paints the last saved display, shows an offline banner, and reloads itself if it gets stuck while online.
  - **`@homeslate/display`** — the kiosk can keep the screen awake and offer a fullscreen button.
  - **`@homeslate/schema`** — displays can turn the wake lock off with `settings.wakeLockEnabled`. A saved Finnhub key is removed from stocks widgets.
- b16106e: Add multi-view display management and an optional viewer passcode.
  
  - **`@homeslate/host-react`** — `EditorPage` is now a display management surface
    (Views / Settings / Theme tabs) and a new `ViewEditorPage` renders the per-view
    canvas editor. `DisplaySettingsPanel` covers auto-rotate, sticky notes, alarms,
    voice commands, holiday effects, and the viewer passcode; `ViewsPanel` adds,
    renames, reorders, hides, and deletes views. `KioskPage` prompts for the PIN
    when the display is locked. Also exports `useDisplayDocument` and the API
    helpers (`getPublicDocument`, `publicDocumentUrl`, `patchJson`,
    `setDisplayPasscode`).
  - **`@homeslate/display/canvas`** — adds `addView`, `removeView`, `moveView`, and
    `setActiveView` document helpers.
  - **`@homeslate/adapters`** — display stores gain `getPasscodeHash` /
    `setPasscode`; `SqliteDisplayStore` keeps the hash in a new `passcode_hash`
    column (migrated with `ALTER TABLE`) and never returns it on a `DisplayRecord`.
  - **`@homeslate/server`** — display responses expose `passcodeEnabled` instead of
    the hash, adds `PATCH /api/displays/:id` to set or clear a 4-digit passcode,
    gates `GET` / `PUT /api/public/:publicId` with `401 { passcodeRequired: true }`,
    and exports `hashPasscode` / `verifyPasscode` / `isValidPin`.
- 6ebdf88: Add preset views and inline display rename.
  
  - **`@homeslate/display/canvas`** — new `PRESET_VIEW_NAMES`, `createPresetView`,
    `missingPresetViews`, and `addPresetViews` helpers that build the
    Morning / Evening / Weekend starter views from the registered widget defaults.
  - **`@homeslate/host-react`** — `ViewsPanel` gains an **Add preset views** button
    (skipping any presets already present), and the management header renames the
    display inline, saved through the same debounced document `PUT`.

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
  - @homeslate/editor@1.0.2

## 0.1.1

### Patch Changes

- Updated dependencies [d0bcb9e]
  - @homeslate/widgets@1.1.0
  - @homeslate/display@1.0.1
  - @homeslate/editor@1.0.1

## 0.1.0

### Minor Changes

- bc65796: Add `@homeslate/server`, the Hono API (display CRUD, the public kiosk route, Google OAuth, and the calendar, commute, and weather-alerts proxies), and `@homeslate/host-react`, the routed React web shell over `@homeslate/editor` and `@homeslate/display`. Self-hosters can now depend on the packages instead of cloning the repo, and the reference app is a thin consumer of both.

### Patch Changes

- Updated dependencies [79fd3ae]
- Updated dependencies [d010d08]
- Updated dependencies [9fe796d]
- Updated dependencies [25def83]
  - @homeslate/widgets@1.0.0
  - @homeslate/display@1.0.0
  - @homeslate/editor@1.0.0
  - @homeslate/schema@1.0.0

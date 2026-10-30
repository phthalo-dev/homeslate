# @homeslate/adapters

## 0.2.2

### Patch Changes

- Updated dependencies [[`4f692a9`](https://github.com/phthalo-dev/homeslate/commit/4f692a9d5cd7e34e7ecc0d873353c35176c6f810)]:
  - @homeslate/widgets@1.3.1

## 0.2.1

### Patch Changes

- Updated dependencies [[`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0), [`07182e9`](https://github.com/phthalo-dev/homeslate/commit/07182e9823ae7ca9febd0eefca8f47f423dce80a)]:
  - @homeslate/widgets@1.3.0

## 0.2.0

### Minor Changes

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
  - @homeslate/widgets@1.2.0
  - @homeslate/schema@1.1.0
  - @homeslate/google@0.1.3

## 0.1.3

### Patch Changes

- Updated dependencies [d0bcb9e]
  - @homeslate/widgets@1.1.0

## 0.1.2

### Patch Changes

- Updated dependencies [79fd3ae]
- Updated dependencies [d010d08]
- Updated dependencies [9fe796d]
- Updated dependencies [25def83]
  - @homeslate/google@0.1.2
  - @homeslate/widgets@1.0.0
  - @homeslate/schema@1.0.0

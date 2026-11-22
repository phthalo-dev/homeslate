# @homeslate/host-react

The homeslate web shell: a routed app over `@homeslate/editor` and
`@homeslate/display`, a Google runtime wired to the homeslate API, and the
debounced persist helper.

```tsx
import { HomeslateApp } from "@homeslate/host-react";

// Inside your provider tree (DesignSystemProvider / IconProvider / LayerProvider):
<HomeslateApp productName="Homeslate" />;
```

Pass `apiBaseUrl` when the API is on another origin, and `widgetRegistry` to
override the widget registry used by the editor and kiosk.

## Routes

`HomeslateApp` wires a `BrowserRouter` with these routes:

- `/` — `DisplayListPage`: lists displays, flags ones with a viewer passcode, and
  creates new ones.
- `/edit/:id` — `DisplayLayout`: loads the display once and renders the app bar, the
  secondary bar (breadcrumbs, export, kiosk link). Its child routes share those bars, so
  they stay mounted as you move between them:
  - `ManageLayout` wraps the management sections with a 280px left nav (the same width
    as the view editor's widget palette; a switcher row on narrow screens):
    - `/edit/:id` — `DisplayViewsPage`: the display's views.
    - `/edit/:id/settings` — `DisplaySettingsPage`: rotation, extras, alarms, and access.
    - `/edit/:id/theme` — `DisplayThemePage`: themes.
  - `/edit/:id/views/:viewId` — `ViewEditorPage`: the per-view canvas editor
    (`@homeslate/editor`), with its toolbar in the secondary bar.
- `/d/:publicId` — `KioskPage`: polls the public document and, when the display
  has a passcode, prompts for the 4-digit PIN before rendering.

Compose the exported pages yourself for different chrome or routing, and read
`useHomeslateHost()` for the config.

## Display management

- **Views** (`ViewsPanel`) add, rename, reorder, hide, and delete the views in a
  document, using the `addView` / `removeView` / `moveView` / `patchView` helpers
  from `@homeslate/display/canvas`. **Add preset views** appends the
  Morning / Evening / Weekend starter views (`addPresetViews`), skipping any the
  document already has.
- **Settings** (`DisplaySettingsPanel`) covers auto-rotate, sticky notes, alarms
  (`AlarmListEditor` from `@homeslate/widgets`), voice commands, holiday effects,
  and the viewer passcode.
- **Theme** reuses `ThemeEditor` from `@homeslate/editor`.

The display name is edited inline in the management header and saved with the
document. Renaming is a normal document edit, so it rides the same debounced
`PUT` as the rest of the display.

The viewer passcode is set through `setDisplayPasscode(baseUrl, id, pin | null)`,
which `PATCH`es `/api/displays/:id`. The PIN itself is hashed server-side and is
never returned; the owner-facing record only carries `passcodeEnabled`.

## Data helpers

`useDisplayDocument(baseUrl, id)` loads a display record, exposes
`document` / `passcodeEnabled` / save state, and persists edits with a debounced
`PUT`. The lower-level `getJson`, `postJson`, `putJson`, `patchJson`,
`getPublicDocument`, `publicDocumentUrl`, and `setDisplayPasscode` are exported
for hosts that build their own data layer.

See the [self-hosting guide](https://github.com/phthalo-dev/homeslate/blob/main/docs/content/docs/self-hosting.mdx).

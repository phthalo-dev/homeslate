---
"@homeslate/host-react": minor
"@homeslate/editor": minor
"@homeslate/widgets": minor
---

Move to `@var-ui` 0.13 and `typestyles` 0.37, and rework the admin interface.

**`@homeslate/host-react` (breaking)**

- `EditorPage` is replaced by a layout route. `DisplayLayout` loads the display once and renders one shared app bar: the logo, the breadcrumb trail, the editor's toolbar, and the export and kiosk actions. On phones the trail collapses to the current page so the bar stays one row. Its child routes keep the bar mounted as you move between them:
  - `ManageLayout` wraps `DisplayViewsPage` (`/edit/:id`), `DisplaySettingsPage` (`/edit/:id/settings`) and `DisplayThemePage` (`/edit/:id/theme`) with a 280px left nav, the same width as the view editor's widget palette. The left nav and the content scroll independently. Below VarUI's md breakpoint the nav becomes a sections switcher.
  - `ViewEditorPage` (`/edit/:id/views/:viewId`) now sits inside `DisplayLayout`, with the editor toolbar in the app bar.
- New exports: `DisplayLayout`, `ManageLayout`, `DisplayViewsPage`, `DisplaySettingsPage`, `DisplayThemePage`, `useDisplay`.
- The empty Theme section starts from a gallery of presets with color swatches; the library's create form appears once a theme exists.
- The display list shows displays as cards. Views are cards with a thumbnail of their widget layout. Settings are grouped into cards of label/description/control rows.
- Styling moves to TypeStyles: the package now depends on `typestyles` and exposes `@homeslate/host-react/styles`, which hosts should import from their typestyles extract entry. There are no inline styles or stylesheet files left in the package.
- Button hierarchy: one solid primary per page, outlined secondary actions, ghost tertiary actions.

**`@homeslate/editor`**

- `Editor` takes an optional `toolbarContainer`. Pass an element to render the toolbar (Background Settings, Household, Themes) there, for example in the host's app bar. Omit it for the previous inline bar.
- Toolbar buttons are ghost buttons, icon-only below 600px. The widget palette starts collapsed on phones, has a filter field, and names its buttons "Add X widget".

**`@homeslate/widgets`**

- `Button` `appearance="filled"` becomes `"solid"` (renamed in VarUI 0.13).
- The household editor row wraps and fits dialogs on narrow screens, and the alarm editor's add control is a labelled "Add alarm" button.

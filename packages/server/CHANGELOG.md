# @homeslate/server

## 0.3.1

### Patch Changes

- [#47](https://github.com/phthalo-dev/homeslate/pull/47) [`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Error messages now render in the danger color: `<Text tone="danger">` was ignored by var-ui, so they appeared as plain text. `@homeslate/widgets` exports an `ErrorText` component for this (until var-ui adds a `danger` tone). The "remove" button in the entity picker now shows its icon. Type errors across the packages are fixed and TypeScript errors now fail CI.
- Updated dependencies [[`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0), [`07182e9`](https://github.com/phthalo-dev/homeslate/commit/07182e9823ae7ca9febd0eefca8f47f423dce80a)]:
  - @homeslate/widgets@1.3.0
  - @homeslate/adapters@0.2.1

## 0.3.0

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
- 8b0fe7a: Reach a home Home Assistant from a hosted homeslate API. `@homeslate/server`'s
  `/api/homeassistant/*` routes now sit behind a `HomeAssistantTransport`, so a
  host can inject one instead of `{ baseUrl, token }`; a new
  `GET /api/homeassistant/status` reports whether the transport is configured and
  connected, and transport failures surface as `503` (agent offline) / `504`
  (timeout). `@homeslate/agent` is a LAN process that dials out to the cloud and
  serves the allowlisted climate methods, keeping the Home Assistant token at home.
  `@homeslate/relay` is the runtime-agnostic cloud side — agent presence plus
  request correlation — with a Node WebSocket binding at `@homeslate/relay/node`.
  `@homeslate/widgets` learns to render relay "agent offline" / timeout states and
  exports the agent copy plus a `homeAssistantStatusUrl()` helper from
  `@homeslate/widgets/server`.
- 6a7c289: Replace the per-domain Home Assistant transport with one generic, allowlisted
  entity + service rail, driven by a single domain registry.
  
  - **`@homeslate/widgets/server`** — a new domain registry is the source of truth
    for entity-id shape, allowed services, allowed data keys, and optional state
    mapping (`registerDomainSpec`, `isKnownDomain`, `entityDomain`,
    `isValidEntityId`, `isAllowedService`, `buildServicePayload`, `mapEntity`). A
    generic `HomeAssistantEntity` projection (`mapHomeAssistantEntity`) covers
    domains that have no dedicated mapper. `@homeslate/widgets` gains generic
    client helpers (`fetchEntities`, `fetchEntity`, `callHomeAssistantService`) and
    hooks (`useEntities`, `useEntity`, `useHomeAssistantService`); the Thermostat
    and To-Do widgets migrate onto them with no behavior change.
  - **`@homeslate/server`** — `HomeAssistantTransport` collapses to three generic
    methods: `listEntities(domain)`, `getEntity(entityId)`, and
    `callService(domain, service, entityId, data, options?)`. The
    `/api/homeassistant/*` routes validate against the registry, so a new domain
    needs a registry entry, not a new route. `HomeAssistantTodoTransport` and
    `hasTodoSupport` are removed (to-do now rides the generic rail).
  - **`@homeslate/agent` / `@homeslate/relay`** — the agent protocol is now **v2**:
    `entities.list` / `entity.get` / `service.call`, with the agent advertising its
    supported domains in its `hello`. The relay transport implements the same
    three methods and re-validates every call before forwarding it to the socket.
- 7924794: Add the first wave of Home Assistant widgets and Home Assistant sources for the
  Weather, Calendar, and Grocery widgets.
  
  - **`@homeslate/widgets`** — three new widgets: **Sensors** (read-only
    `sensor` / `binary_sensor` / `number` / `input_number` readings, list or grid,
    optional gauges), **Scenes & Scripts** (fire-and-forget `scene` / `script` /
    `button` / `input_button` with optional confirmation), and **Presence**
    (`person` / `device_tracker` / `zone`, with avatars and zone names). The
    Weather, Calendar, and Grocery widgets gain a `source` toggle that reads a Home
    Assistant entity instead of Open-Meteo / an iCal feed / a local list. New
    generic hooks `useEntityList`, `useEntitiesAcross`,
    `useHomeAssistantWeather`, and `useHomeAssistantCalendar` build on the Phase 0
    rail.
  - **`@homeslate/widgets/server`** — the domain registry grows the sensor, scene,
    presence, weather, and calendar families, each with its entity-id shape and
    allowlisted services, plus normalized mappers (`mapSensorEntity`,
    `mapPresenceEntity`, `mapWeatherEntity`, `mapWeatherForecast`,
    `mapCalendarEvents`).
  - **`@homeslate/server`** — two read routes ride the generic return-response
    service call: `GET /api/homeassistant/weather/:entityId/forecast` and
    `GET /api/homeassistant/calendar/:entityId/events`.
- 43e2d43: Add the second wave of Home Assistant widgets: on/off devices and covers.
  
  - **`@homeslate/widgets`** — two new widgets: **Devices** (one configurable
    widget for `light` / `switch` / `input_boolean` / `fan`, with a domain filter,
    optimistic on/off toggles, a fan-speed chip, and an optional brightness slider
    for lights) and **Covers & Garage** (`cover`, with open / close / stop,
    position percentages and a slider, and a confirmation before opening garage
    doors). Both build on the Phase 0 rail and the Phase 1 generic hooks.
  - **`@homeslate/widgets/server`** — the domain registry grows the on/off device
    family (`light`, `switch`, `input_boolean`, `fan`) and `cover`, each with its
    entity-id shape and allowlisted services (`turn_on` / `turn_off` / `toggle`;
    `open_cover` / `close_cover` / `stop_cover` / `set_cover_position`), plus the
    normalized mappers `mapDeviceEntity` and `mapCoverEntity`.
- 24dd8a8: Add the Phase 3 Home Assistant controllers.
  
  - **`@homeslate/widgets`** — six new widgets:
    - **Security** — locks (`lock` / `unlock` / `open` with confirmation) and
      alarm panels (only the arm modes the panel advertises; confirm before
      disarming). Unlocked/disarmed states use an attention color.
    - **Media Player** — now-playing metadata and artwork, play/pause, previous /
      next, volume + mute, and a source picker. Controls and the source picker are
      gated on `supported_features`, and artwork is served through the host proxy.
    - **Fan** — power, speed percentage, preset mode, and oscillate, gated on the
      fan feature bits. Air purifiers use the same domain.
    - **Vacuum** — start/resume, pause, stop, dock, locate, spot clean, battery,
      and an optional fan-speed picker, with command gating.
    - **Humidifier** — power, current + target humidity, and mode.
    - **Water Heater** — power, current + target temperature, and operation mode.
  - **`@homeslate/widgets/server`** — the domain registry grows `lock`,
    `alarm_control_panel`, `media_player`, `fan` (extended from on/off), `vacuum`,
    `humidifier`, and `water_heater`, each with its entity-id shape and
    allowlisted services. Generic payload building now preserves boolean data keys
    (`is_volume_muted`, `oscillating`). New normalized mappers:
    `mapLockEntity`, `mapAlarmEntity`, `mapMediaPlayerEntity`, `mapFanEntity`,
    `mapVacuumEntity`, `mapHumidifierEntity`, `mapWaterHeaterEntity`.
  - **`@homeslate/server`** — a new `GET /api/homeassistant/image` route re-serves
    Home Assistant artwork / camera snapshots from the two proxy path families,
    injects the host token, enforces a size cap, and caches briefly. Direct LAN
    transports implement `fetchImage`; relay transports can add it later.
- d7ce792: Add the Phase 4 Home Assistant data and niche widgets.
  
  - **`@homeslate/widgets`** — five new widgets:
    - **Home Status** — a read-only roll-up of lights on, covers open, doors/windows
      open, alarm state, people home, and chosen temperature sensors. Manual entity
      grouping in v1.
    - **Energy** — live power (W/kW normalized to kW), energy (Wh/kWh/MWh
      normalized to kWh), and an optional cost estimate from a per-kWh rate.
    - **Camera** — a refreshing snapshot with a configurable cadence, a runtime
      privacy toggle that pauses snapshots, and no Home Assistant origin/token in
      the browser.
    - **Updates** — pending `update` entities with install, skip, progress, and an
      optional up-to-date list.
    - **Lawn Mower** — start/pause, dock, and stop for `lawn_mower` entities.
  - **`@homeslate/widgets/server`** — new normalized mappers
    `mapCameraEntity`, `mapUpdateEntity`, and `mapLawnMowerEntity`, plus the
    `camera` (read-only), `update` (`install` / `skip`), and `lawn_mower`
    (`start_pause` / `dock` / `stop`) registry families. Home Status and Energy
    reuse the existing sensor, cover, alarm, presence, and light mappers.
  - **`@homeslate/server`** — the image proxy accepts a cache-busting `t`
    parameter so camera snapshots can bypass the proxy cache when the widget asks
    for a fresh frame, while ordinary artwork stays cached.
- 38cbc67: Add the Phase 5 strategic Home Assistant widgets.
  
  - **`@homeslate/widgets`** — four new widgets:
    - **Entity Tile** — bind any registry entity and render its primary control
      (`toggle`, `brightness`, cover `position`, media `play-pause`, or `lock`).
      Long-tail domains fall back to a read-only state.
    - **Room** — manually group a room's lights, switches, and covers, with
      per-entity controls plus All off / All on / Close covers.
    - **Notify** — send a `notify.send_message` notification or a `tts.speak`
      announcement to a Home Assistant media player, with a runtime message input.
    - **History** — a numeric sensor with its current value and a downsampled
      `/api/history/period` sparkline over a 1–168 hour window.
  - **`@homeslate/widgets/server`** — new `notify` (`send_message`) and `tts`
    (`speak`) registry families, plus `mapHistoryPoints` and the shared history
    window/downsample helpers. `HOME_ASSISTANT_DOMAINS` is the client-safe domain
    list used by the Entity Tile picker.
  - **`@homeslate/server`** — `GET /api/homeassistant/history/:entityId?hours=…`
    and an optional `history` transport method. The direct LAN client implements
    it; relay transports can add it later (the route returns `501` until then).
- 8b0fe7a: Add a Home Assistant thermostat widget. `@homeslate/server` gains scoped
  `/api/homeassistant/*` routes (list climate entities, read one entity's state,
  call an allowlisted climate service) configured with a host-level
  `homeAssistant: { baseUrl, token }` option, so the long-lived token never
  reaches the browser. `@homeslate/widgets` gains the `thermostat` widget, the
  `useThermostat` / `useClimateEntities` hooks, and React-free climate helpers
  exported from `@homeslate/widgets/server`.
- ccd45bc: Integrate the To-Do List widget with Home Assistant `todo` lists.
  
  - **`@homeslate/server`** — the Home Assistant proxy now serves the `todo`
    domain: `GET /api/homeassistant/entities?domain=todo` lists `todo.*` entities,
    `GET /api/homeassistant/todo/:entityId/items` reads items through
    `todo.get_items`, and `POST /api/homeassistant/services/todo/:service`
    forwards the allowlisted `add_item` / `update_item` / `remove_item` calls.
    To-do is served through the same generic `HomeAssistantTransport` seam as
    climate (`listEntities` / `getEntity` / `callService`).
  - **`@homeslate/widgets`** — the To-Do List widget gains a **List source**
    setting. Choose `Home Assistant`, pick one `todo.*` entity, and the kiosk
    reads and writes that list in place (items stay in sync across displays).
    `Local` remains the default and keeps items in the display document.
    `@homeslate/widgets/server` exports `mapTodoItems`,
    `buildTodoServicePayload`, `isValidTodoEntityId`, `isAllowedTodoService`, and
    the `HomeAssistantTodoItem` type for hosts that proxy Home Assistant
    themselves.
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
- Updated dependencies [b16106e]
  - @homeslate/widgets@1.2.0
  - @homeslate/adapters@0.2.0
  - @homeslate/google@0.1.3

## 0.2.0

### Minor Changes

- d0bcb9e: Add a Home Assistant thermostat widget. `@homeslate/server` gains scoped
  `/api/homeassistant/*` routes (list climate entities, read one entity's state,
  call an allowlisted climate service) configured with a host-level
  `homeAssistant: { baseUrl, token }` option, so the long-lived token never
  reaches the browser. `@homeslate/widgets` gains the `thermostat` widget, the
  `useThermostat` / `useClimateEntities` hooks, and React-free climate helpers
  exported from `@homeslate/widgets/server`.

### Patch Changes

- Updated dependencies [d0bcb9e]
  - @homeslate/widgets@1.1.0
  - @homeslate/adapters@0.1.3

## 0.1.0

### Minor Changes

- bc65796: Add `@homeslate/server`, the Hono API (display CRUD, the public kiosk route, Google OAuth, and the calendar, commute, and weather-alerts proxies), and `@homeslate/host-react`, the routed React web shell over `@homeslate/editor` and `@homeslate/display`. Self-hosters can now depend on the packages instead of cloning the repo, and the reference app is a thin consumer of both.

### Patch Changes

- Updated dependencies [79fd3ae]
- Updated dependencies [d010d08]
- Updated dependencies [9fe796d]
- Updated dependencies [25def83]
  - @homeslate/google@0.1.2
  - @homeslate/widgets@1.0.0
  - @homeslate/adapters@0.1.2

# @homeslate/relay

## 0.1.2

### Patch Changes

- Updated dependencies [[`4f692a9`](https://github.com/phthalo-dev/homeslate/commit/4f692a9d5cd7e34e7ecc0d873353c35176c6f810)]:
  - @homeslate/widgets@1.3.1
  - @homeslate/server@0.3.2

## 0.1.1

### Patch Changes

- [#47](https://github.com/phthalo-dev/homeslate/pull/47) [`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0) Thanks [@dbanksdesign](https://github.com/dbanksdesign)! - Error messages now render in the danger color: `<Text tone="danger">` was ignored by var-ui, so they appeared as plain text. `@homeslate/widgets` exports an `ErrorText` component for this (until var-ui adds a `danger` tone). The "remove" button in the entity picker now shows its icon. Type errors across the packages are fixed and TypeScript errors now fail CI.
- Updated dependencies [[`f9005fc`](https://github.com/phthalo-dev/homeslate/commit/f9005fc1d1cbb82c1fd2b59814a0e901d4a0abf0), [`07182e9`](https://github.com/phthalo-dev/homeslate/commit/07182e9823ae7ca9febd0eefca8f47f423dce80a)]:
  - @homeslate/widgets@1.3.0
  - @homeslate/server@0.3.1

## 0.1.0

### Minor Changes

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
  - @homeslate/server@0.3.0
  - @homeslate/widgets@1.2.0

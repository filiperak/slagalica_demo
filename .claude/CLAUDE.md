# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root.

```bash
# Development (starts both server on :5500 and Vite client on :5173 concurrently)
npm run dev

# Individual processes
npm run dev:server   # nodemon → tsx server/index.ts (watches server/)
npm run dev:client   # vite --config app/vite.config.ts

# Build (tsc for server + vite build for client → dist/)
npm run build

# Tests (Jest, ESM)
npm test

# Format
npm run format        # write
npm run format:check  # check only
```

## Architecture

Full-stack TypeScript monorepo. Server and client are separate TypeScript projects with separate `tsconfig.json` files. The root `tsconfig.json` covers `server/` only; Vite handles client compilation via `app/tsconfig.json`.

```
server/         Node.js + Express + Socket.io (runs on :5500)
app/            Vite SPA (proxies /socket.io → :5500 in dev)
  src/          TypeScript source
  public/       Static assets and HTML partials (views/*.html)
tests/          Jest tests (ESM, covers server-side game logic)
dist/           Build output — dist/server/ and dist/app/
```

### Server

- **`server/Index.ts`** — Express app, static file serving, Socket.io server init. Resolves static folder by checking `dist/app` first (production), then `app/` (dev TS run).
- **`server/GameEngine.ts`** — `Game` class: all game state, score tracking, and `create*()` / `validate*()` methods for each of the 6 mini-games.
- **`server/SocketHandler.ts`** — maps every socket event to `Game` methods. Handles room creation, reconnection, and single-player vs. multiplayer modes.
- **`server/Constants.ts`** — server-side event name constants (keep in sync with `app/src/util/ClientConstants.ts`).

### Client

- **`App.ts`** — creates the Socket.io client, instantiates all `Page` subclasses, owns the `go(view)` router. Listens for game-level socket events and delegates to `Store`.
- **`Page.ts`** — abstract base for every page. Owns event cleanup (`addEvents` / `dispose`), socket event cleanup, timer/header logic (`initHeader`), and the store subscription pattern.
- **`Store.ts`** — holds `GameState`, a simple subscribe/notify pattern, and an `EventBus` for typed inter-component events.
- **`pages/`** — one class per view (`Loby`, `Menu`, `Slagalica`, `MojBroj`). Each calls `super()`, then `init()` fetches its HTML partial, queries DOM into `_localDom`, and wires events.
- **`ThemeService.ts`** — `get()` / `apply(theme)` / `toggle()`. Single source of truth for `data-theme` on `<html>` and `localStorage` key `user-theme`.

### Page lifecycle

```
App.go(view) → Page.dispose() on previous  →  Page.init() on next
                 removes all addEvents listeners     fetches HTML partial, queries DOM, adds events
```

`addEvents` registers listeners in `this._events[]`; `dispose` removes them all. Always use `addEvents` — never attach bare `addEventListener` on page elements (use bare `document.addEventListener` only for document-level concerns like closing dropdowns).

### HTML partials

Views are fetched at runtime by `FetchHTML` and injected into `#gameContainer`. Partials live in `app/public/views/*.html`. The modal in `index.html` is a static partial managed by `Partials.ts`.

### Styling

Tailwind CSS v4 (no `tailwind.config.js` — config is CSS-first via `app/src/style.css`). DaisyUI v5 loaded as `@plugin "daisyui"`.

**Do not use arbitrary hex color values.** All colors are defined as semantic CSS custom properties in `style.css` and consumed via Tailwind utilities:

| Utility class | Purpose |
|---|---|
| `bg-surface` / `bg-surface-raised` / `bg-surface-overlay` | Background layers |
| `text-content` / `text-content-muted` / `text-content-subtle` | Text hierarchy |
| `border-dim` | Default borders and inputs |
| `bg-brand` / `hover:bg-brand-hover` / `active:bg-brand-active` | Primary blue (#5865f2) |
| `bg-positive` / `bg-positive-hover` / `bg-positive-active` | Success green |
| `text-negative` / `border-negative` | Danger red |

Theme values are set per `[data-theme="dark"]` / `[data-theme="light"]` in `style.css`. The anti-flash script in `index.html` applies the saved theme before CSS loads.

### Socket event names

Always reference `SOCKET_EVENTS` from `app/src/util/ClientConstants.ts` (client) and `server/Constants.ts` (server) — never hardcode string event names.

### Naming conventions

- Public methods: `methodName` (no prefix or suffix).
- Private methods: `_methodName` (single leading underscore).
- Private/protected properties: `_propertyName` (single leading underscore, e.g. `_localDom`).
- Page DOM query results are collected into a typed `LocalDomElements` interface and stored in `this._localDom`.
- Socket handlers on the server follow the pattern: `socket.on(EVENT, handler)` inside `SocketHandler`.

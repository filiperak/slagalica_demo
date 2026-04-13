// @vitest-environment jsdom
import { SOCKET_EVENTS, VIEWS } from "../../app/src/util/ClientConstants";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Capture socket event handlers so tests can fire them manually
const socketHandlers: Record<string, (...args: any[]) => void> = {};
const mockSocket = {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
        socketHandlers[event] = handler;
    }),
    off: vi.fn(),
    emit: vi.fn(),
};

vi.mock("socket.io-client", () => ({
    io: vi.fn(() => mockSocket),
}));

// Mock every page class — each is a constructor that returns a spy object
class MockPage { init = vi.fn(); dispose = vi.fn() }

vi.mock("../../app/src/pages/Loby",        () => ({ default:     class { init = vi.fn(); dispose = vi.fn() } }));
vi.mock("../../app/src/pages/Menu",        () => ({ Menu:        class { init = vi.fn(); dispose = vi.fn() } }));
vi.mock("../../app/src/pages/Slagalica",   () => ({ Slagalica:   class { init = vi.fn(); dispose = vi.fn() } }));
vi.mock("../../app/src/pages/MojBroj",     () => ({ MojBroj:     class { init = vi.fn(); dispose = vi.fn() } }));
vi.mock("../../app/src/pages/Spojnice",    () => ({ Spojnice:    class { init = vi.fn(); dispose = vi.fn() } }));
vi.mock("../../app/src/pages/Skocko",      () => ({ Skocko:      class { init = vi.fn(); dispose = vi.fn() } }));
vi.mock("../../app/src/pages/Koznazna",    () => ({ KoZnaZna:    class { init = vi.fn(); dispose = vi.fn() } }));
vi.mock("../../app/src/pages/Asocijacije", () => ({ Asocijacije: class { init = vi.fn(); dispose = vi.fn() } }));

// Partial mock — only hideModal is used by App
vi.mock("../../app/src/util/Partials", () => ({
    Partial: class { showModal = vi.fn(); hideModal = vi.fn() },
}));

// ThemeService is called in constructor — mock to avoid DOM side-effects
vi.mock("../../app/src/util/ThemeService", () => ({
    ThemeService: { get: vi.fn(() => "dark"), apply: vi.fn(), toggle: vi.fn() },
}));

// ── Lazy import after mocks are in place ──────────────────────────────────────

let App: typeof import("../../app/src/App").default;
beforeAll(async () => {
    ({ default: App } = await import("../../app/src/App"));
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("App.go", () => {
    test("calls init() on the target view", () => {
        const app = new App();
        app.go(VIEWS.MENU as any);
        // @ts-expect-error accessing private
        expect(app._views.menu.init).toHaveBeenCalledOnce();
    });

    test("calls dispose() on the previously active view when navigating away", () => {
        const app = new App();
        app.go(VIEWS.MENU as any);
        // @ts-expect-error
        const menuPage = app._views.menu;

        app.go(VIEWS.SLAGALICA as any);
        expect(menuPage.dispose).toHaveBeenCalledOnce();
    });

    test("does not call dispose on the first navigation (no previous view)", () => {
        const app = new App();
        // @ts-expect-error
        const lobyPage = app._views.loby;

        app.go(VIEWS.LOBY as any);
        // first go call — no previous view to dispose
        expect(lobyPage.dispose).not.toHaveBeenCalled();
    });
});

describe("App socket events", () => {
    test("START_GAME updates the store and navigates to menu", () => {
        const app = new App();
        const mockGame = { gameId: "g1", players: [] };

        socketHandlers[SOCKET_EVENTS.STATE.START_GAME]({ game: mockGame });

        // @ts-expect-error
        expect(app._store.getState()).toBe(mockGame);
        // @ts-expect-error
        expect(app._views.menu.init).toHaveBeenCalled();
    });

    test("START_SINGLE_PLAYER updates the store and navigates to menu", () => {
        const app = new App();
        const mockGame = { gameId: "sp1", players: [] };

        socketHandlers[SOCKET_EVENTS.STATE.START_SINGLE_PLAYER]({ game: mockGame });

        // @ts-expect-error
        expect(app._store.getState()).toBe(mockGame);
        // @ts-expect-error
        expect(app._views.menu.init).toHaveBeenCalled();
    });

    test("GAME_DATA navigates to the correct minigame view", () => {
        const app = new App();

        socketHandlers[SOCKET_EVENTS.STATE.GAME_DATA]({
            gameKey: VIEWS.SLAGALICA,
            gameState: {},
        });

        // @ts-expect-error
        expect(app._views.slagalica.init).toHaveBeenCalled();
    });

    test("PLAYERS_STATE updates the store", () => {
        const app = new App();
        const state = { gameId: "g2", players: [{ id: "p1" }] };

        socketHandlers[SOCKET_EVENTS.STATE.PLAYERS_STATE](state);

        // @ts-expect-error
        expect(app._store.getState()).toBe(state);
    });
});

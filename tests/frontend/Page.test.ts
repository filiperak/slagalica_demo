// @vitest-environment jsdom
import Page from "../../app/src/Page";
import { Store, GameState } from "../../app/src/Store";

// ── Concrete subclass for testing the abstract Page ───────────────────────────

class TestPage extends Page {
    public rendered: GameState[] = [];

    render__(state: GameState) {
        this.rendered.push(state);
    }

    // Expose protected methods
    callAddEvents__(el: HTMLElement, ev: string, cb: EventListener) {
        this.addEvents__(el, ev, cb);
    }
    callAddSocketEvents__(name: string, cb: (...args: any[]) => void) {
        this.addSocketEvents__(name, cb);
    }
    callInitHeader__(duration?: number) {
        this.initHeader__(duration);
    }
    callSubscribeToStore__() {
        this.subscribeToStore__();
    }
    callClearTimer__() {
        this._clearTimer__();
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeSocketMock = () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
});

const makeAppMock = () => ({ go: vi.fn() });

function setupDOM() {
    document.body.innerHTML = `
        <div id="gameContainer"></div>
        <div id="gameHeader"></div>
    `;
}

function makePage() {
    const socket = makeSocketMock();
    const store = new Store();
    const app = makeAppMock();
    const page = new TestPage(socket as any, store, app as any);
    return { page, socket, store, app };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
    setupDOM();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("Page — addEvents__ / dispose__", () => {
    test("registered listener is called on event", () => {
        const { page } = makePage();
        const btn = document.createElement("button");
        const handler = vi.fn();

        page.callAddEvents__(btn, "click", handler);
        btn.click();

        expect(handler).toHaveBeenCalledOnce();
    });

    test("dispose__ removes all registered DOM listeners", () => {
        const { page } = makePage();
        const btn = document.createElement("button");
        const handler = vi.fn();

        page.callAddEvents__(btn, "click", handler);
        page.dispose__();
        btn.click();

        expect(handler).not.toHaveBeenCalled();
    });

    test("multiple listeners are all cleaned up by dispose__", () => {
        const { page } = makePage();
        const el = document.createElement("div");
        const h1 = vi.fn();
        const h2 = vi.fn();

        page.callAddEvents__(el, "click", h1);
        page.callAddEvents__(el, "mouseover", h2);
        page.dispose__();

        el.dispatchEvent(new Event("click"));
        el.dispatchEvent(new Event("mouseover"));

        expect(h1).not.toHaveBeenCalled();
        expect(h2).not.toHaveBeenCalled();
    });
});

describe("Page — addSocketEvents__ / dispose__", () => {
    test("socket.on is called when addSocketEvents__ is used", () => {
        const { page, socket } = makePage();
        const handler = vi.fn();

        page.callAddSocketEvents__("someEvent", handler);

        expect(socket.on).toHaveBeenCalledWith("someEvent", handler);
    });

    test("dispose__ calls socket.off for all registered socket events", () => {
        const { page, socket } = makePage();
        const handler = vi.fn();

        page.callAddSocketEvents__("eventA", handler);
        page.dispose__();

        expect(socket.off).toHaveBeenCalledWith("eventA", handler);
    });

    test("multiple socket events are all removed on dispose__", () => {
        const { page, socket } = makePage();

        page.callAddSocketEvents__("e1", vi.fn());
        page.callAddSocketEvents__("e2", vi.fn());
        page.dispose__();

        expect(socket.off).toHaveBeenCalledTimes(2);
    });
});

describe("Page — subscribeToStore__", () => {
    test("render__ is called immediately with current state on subscribe", () => {
        const { page, store } = makePage();
        const state = { gameId: "g1" } as GameState;
        store.setState__(state);

        page.callSubscribeToStore__();

        expect(page.rendered).toHaveLength(1);
        expect(page.rendered[0]).toBe(state);
    });

    test("render__ is called when state updates after subscribing", () => {
        const { page, store } = makePage();
        page.callSubscribeToStore__();

        const state = { gameId: "g2" } as GameState;
        store.setState__(state);

        expect(page.rendered).toContain(state);
    });

    test("dispose__ unsubscribes from the store", () => {
        const { page, store } = makePage();
        page.callSubscribeToStore__();
        page.dispose__();

        const before = page.rendered.length;
        store.setState__({ gameId: "g3" } as GameState);

        expect(page.rendered.length).toBe(before);
    });

    test("calling subscribeToStore__ twice does not double-subscribe", () => {
        const { page, store } = makePage();
        page.callSubscribeToStore__();
        page.callSubscribeToStore__();

        const before = page.rendered.length;
        store.setState__({ gameId: "g4" } as GameState);

        // Only one render call, not two
        expect(page.rendered.length).toBe(before + 1);
    });
});

describe("Page — initHeader__ / timer", () => {
    test("initHeader__ inserts timer HTML into #gameHeader", () => {
        const { page } = makePage();
        page.callInitHeader__(60);
        const header = document.querySelector("#gameHeader")!;
        expect(header.innerHTML).toContain("header-timer-count");
        expect(header.innerHTML).toContain("header-progress-bar");
    });

    test("timer count decrements each second", () => {
        const { page } = makePage();
        page.callInitHeader__(10);
        vi.advanceTimersByTime(3000);
        const timerEl = document.querySelector("#header-timer-count")!;
        expect(timerEl.textContent?.trim()).toBe("7");
    });

    test("progress bar width shrinks as timer counts down", () => {
        const { page } = makePage();
        page.callInitHeader__(10);
        vi.advanceTimersByTime(5000);
        const bar = document.querySelector<HTMLElement>("#header-progress-bar")!;
        expect(bar.style.width).toBe("50%");
    });

    test("dispose__ stops the timer", () => {
        const { page } = makePage();
        page.callInitHeader__(10);
        page.dispose__();
        vi.advanceTimersByTime(5000);
        // After dispose the header is cleared; timer should no longer update
        const timerEl = document.querySelector("#header-timer-count");
        expect(timerEl).toBeNull();
    });

    test("dispose__ clears #gameHeader innerHTML", () => {
        const { page } = makePage();
        page.callInitHeader__(30);
        page.dispose__();
        expect(document.querySelector("#gameHeader")!.innerHTML).toBe("");
    });
});

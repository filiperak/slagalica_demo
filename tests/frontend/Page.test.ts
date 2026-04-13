// @vitest-environment jsdom
import Page from "../../app/src/Page";
import { Store } from "../../app/src/Store";

// ── Concrete subclass for testing the abstract Page ───────────────────────────

class TestPage extends Page {
    // Expose protected methods
    callAddEvents(el: HTMLElement, ev: string, cb: EventListener) {
        this.addEvents(el, ev, cb);
    }
    callAddSocketEvents(name: string, cb: (...args: any[]) => void) {
        this.addSocketEvents(name, cb);
    }
    callInitHeader(duration?: number) {
        this.initHeader(duration);
    }
    callClearTimer() {
        this.clearTimer();
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

describe("Page — addEvents / dispose", () => {
    test("registered listener is called on event", () => {
        const { page } = makePage();
        const btn = document.createElement("button");
        const handler = vi.fn();

        page.callAddEvents(btn, "click", handler);
        btn.click();

        expect(handler).toHaveBeenCalledOnce();
    });

    test("dispose removes all registered DOM listeners", () => {
        const { page } = makePage();
        const btn = document.createElement("button");
        const handler = vi.fn();

        page.callAddEvents(btn, "click", handler);
        page.dispose();
        btn.click();

        expect(handler).not.toHaveBeenCalled();
    });

    test("multiple listeners are all cleaned up by dispose", () => {
        const { page } = makePage();
        const el = document.createElement("div");
        const h1 = vi.fn();
        const h2 = vi.fn();

        page.callAddEvents(el, "click", h1);
        page.callAddEvents(el, "mouseover", h2);
        page.dispose();

        el.dispatchEvent(new Event("click"));
        el.dispatchEvent(new Event("mouseover"));

        expect(h1).not.toHaveBeenCalled();
        expect(h2).not.toHaveBeenCalled();
    });
});

describe("Page — addSocketEvents / dispose", () => {
    test("socket.on is called when addSocketEvents is used", () => {
        const { page, socket } = makePage();
        const handler = vi.fn();

        page.callAddSocketEvents("someEvent", handler);

        expect(socket.on).toHaveBeenCalledWith("someEvent", handler);
    });

    test("dispose calls socket.off for all registered socket events", () => {
        const { page, socket } = makePage();
        const handler = vi.fn();

        page.callAddSocketEvents("eventA", handler);
        page.dispose();

        expect(socket.off).toHaveBeenCalledWith("eventA", handler);
    });

    test("multiple socket events are all removed on dispose", () => {
        const { page, socket } = makePage();

        page.callAddSocketEvents("e1", vi.fn());
        page.callAddSocketEvents("e2", vi.fn());
        page.dispose();

        expect(socket.off).toHaveBeenCalledTimes(2);
    });
});


describe("Page — initHeader / timer", () => {
    test("initHeader inserts timer HTML into #gameHeader", () => {
        const { page } = makePage();
        page.callInitHeader(60);
        const header = document.querySelector("#gameHeader")!;
        expect(header.innerHTML).toContain("header-timer-count");
        expect(header.innerHTML).toContain("header-progress-bar");
    });

    test("timer count decrements each second", () => {
        const { page } = makePage();
        page.callInitHeader(10);
        vi.advanceTimersByTime(3000);
        const timerEl = document.querySelector("#header-timer-count")!;
        expect(timerEl.textContent?.trim()).toBe("7");
    });

    test("progress bar width shrinks as timer counts down", () => {
        const { page } = makePage();
        page.callInitHeader(10);
        vi.advanceTimersByTime(5000);
        const bar = document.querySelector<HTMLElement>("#header-progress-bar")!;
        expect(bar.style.width).toBe("50%");
    });

    test("dispose stops the timer", () => {
        const { page } = makePage();
        page.callInitHeader(10);
        page.dispose();
        vi.advanceTimersByTime(5000);
        // After dispose the header is cleared; timer should no longer update
        const timerEl = document.querySelector("#header-timer-count");
        expect(timerEl).toBeNull();
    });

    test("dispose clears #gameHeader innerHTML", () => {
        const { page } = makePage();
        page.callInitHeader(30);
        page.dispose();
        expect(document.querySelector("#gameHeader")!.innerHTML).toBe("");
    });
});

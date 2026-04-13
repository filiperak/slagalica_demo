// @vitest-environment jsdom
import { FetchHTML, emit, ping } from "../../app/src/util/Util";

// ── FetchHTML ─────────────────────────────────────────────────────────────────

describe("FetchHTML", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("returns sanitized HTML on a successful fetch", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("<div><p>Hello</p></div>"),
        } as any);

        const result = await FetchHTML("/some/path");
        expect(result).toContain("Hello");
    });

    test("returns error div when response is not ok", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: "Not Found",
        } as any);

        const result = await FetchHTML("/bad/path");
        expect(result).toContain("error");
    });

    test("returns error div when fetch throws a network error", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
        const result = await FetchHTML("/bad/path");
        expect(result).toContain("error");
    });

    // ── Sanitization ──────────────────────────────────────────────────────────

    test("strips <script> tags from the response", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<script>alert("xss")</script><p>safe</p>'),
        } as any);
        const result = await FetchHTML("/path");
        expect(result).not.toContain("<script");
        expect(result).toContain("safe");
    });

    test("removes inline on* event handler attributes", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<button onclick="evil()">Click</button>'),
        } as any);
        const result = await FetchHTML("/path");
        expect(result).not.toContain("onclick");
        expect(result).toContain("Click");
    });

    test("removes javascript: href values", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<a href="javascript:alert(1)">link</a>'),
        } as any);
        const result = await FetchHTML("/path");
        expect(result).not.toContain("javascript:");
    });

    test("removes <iframe> elements", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<iframe src="evil.com"></iframe><p>content</p>'),
        } as any);
        const result = await FetchHTML("/path");
        expect(result).not.toContain("iframe");
        expect(result).toContain("content");
    });

    test("removes <form> elements", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<form action="/submit"><input /></form><p>ok</p>'),
        } as any);
        const result = await FetchHTML("/path");
        expect(result).not.toContain("<form");
        expect(result).toContain("ok");
    });

    test("preserves safe attributes on elements", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<a href="https://example.com" class="link">Click</a>'),
        } as any);
        const result = await FetchHTML("/path");
        expect(result).toContain('href="https://example.com"');
        expect(result).toContain("link");
    });
});

// ── emit ──────────────────────────────────────────────────────────────────────

describe("emit", () => {
    test("dispatches a CustomEvent on window with the correct name", () => {
        const handler = vi.fn();
        window.addEventListener("testEvent", handler);
        emit("testEvent", { value: 42 });
        expect(handler).toHaveBeenCalledOnce();
        window.removeEventListener("testEvent", handler);
    });

    test("CustomEvent carries the correct detail payload", () => {
        const handler = vi.fn();
        window.addEventListener("dataEvent", handler);
        emit("dataEvent", { score: 10 });
        const event = handler.mock.calls[0][0] as CustomEvent;
        expect(event.detail).toEqual({ score: 10 });
        window.removeEventListener("dataEvent", handler);
    });

    test("dispatches on a custom target element", () => {
        const target = document.createElement("div");
        const handler = vi.fn();
        target.addEventListener("myEvent", handler);
        emit("myEvent", "payload", target);
        expect(handler).toHaveBeenCalledOnce();
    });

    test("event bubbles up from a custom target", () => {
        const child = document.createElement("div");
        document.body.appendChild(child);
        const handler = vi.fn();
        document.body.addEventListener("bubbleEvent", handler);
        emit("bubbleEvent", null, child);
        expect(handler).toHaveBeenCalledOnce();
        document.body.removeEventListener("bubbleEvent", handler);
        document.body.removeChild(child);
    });
});

// ── ping ──────────────────────────────────────────────────────────────────────

describe("ping", () => {
    test("dispatches an Event on document.body by default", () => {
        const handler = vi.fn();
        document.body.addEventListener("myPing", handler);
        ping("myPing");
        expect(handler).toHaveBeenCalledOnce();
        document.body.removeEventListener("myPing", handler);
    });

    test("dispatches on a custom target", () => {
        const target = document.createElement("span");
        document.body.appendChild(target);
        const handler = vi.fn();
        target.addEventListener("customPing", handler);
        ping("customPing", target);
        expect(handler).toHaveBeenCalledOnce();
        document.body.removeChild(target);
    });

    test("ping event bubbles from document.body to window", () => {
        const handler = vi.fn();
        window.addEventListener("bubblePing", handler);
        ping("bubblePing");
        expect(handler).toHaveBeenCalledOnce();
        window.removeEventListener("bubblePing", handler);
    });
});

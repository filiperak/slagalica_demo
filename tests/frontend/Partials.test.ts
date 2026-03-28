// @vitest-environment jsdom
import { Partial } from "../../app/src/util/Partials";

// ── DOM setup ─────────────────────────────────────────────────────────────────

function setupModalDOM() {
    document.body.innerHTML = `
        <div id="modalOverlay" class="hidden">
            <h2 id="modalTitle"></h2>
            <p id="modalText"></p>
            <div id="modalSolution" class="hidden">
                <span id="modalSolutionText"></span>
            </div>
            <button id="modalPrimary" class="hidden"></button>
            <button id="modalSecondary" class="hidden"></button>
            <div id="modalLoadingAnimation" class="hidden"></div>
        </div>
    `;
}

beforeEach(() => {
    setupModalDOM();
});

// ── showModal ───────────────────────────────────────────────────────────────

describe("Partial.showModal", () => {
    test("sets title and text", () => {
        const partial = new Partial();
        partial.showModal({ title: "Test Title", text: "Test Body" });
        expect(document.querySelector<HTMLElement>("#modalTitle")!.innerText).toBe("Test Title");
        expect(document.querySelector<HTMLElement>("#modalText")!.innerText).toBe("Test Body");
    });

    test("removes 'hidden' from the overlay", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B" });
        expect(document.querySelector("#modalOverlay")!.classList.contains("hidden")).toBe(false);
    });

    test("shows solution box when solution is provided", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B", solution: "42" });
        expect(document.querySelector("#modalSolution")!.classList.contains("hidden")).toBe(false);
        expect(document.querySelector<HTMLElement>("#modalSolutionText")!.innerText).toBe("42");
    });

    test("hides solution box when no solution is provided", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B" });
        expect(document.querySelector("#modalSolution")!.classList.contains("hidden")).toBe(true);
    });

    test("shows spinner when spinner:true", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B", spinner: true });
        expect(document.querySelector("#modalLoadingAnimation")!.classList.contains("hidden")).toBe(false);
    });

    test("hides spinner by default", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B" });
        expect(document.querySelector("#modalLoadingAnimation")!.classList.contains("hidden")).toBe(true);
    });

    test("shows primary button and fires primaryAction on click", () => {
        const partial = new Partial();
        const action = vi.fn();
        partial.showModal({ title: "T", text: "B", primaryText: "OK", primaryAction: action });

        const btn = document.querySelector<HTMLButtonElement>("#modalPrimary")!;
        expect(btn.classList.contains("hidden")).toBe(false);
        expect(btn.innerText).toBe("OK");

        btn.click();
        expect(action).toHaveBeenCalledOnce();
    });

    test("primary button click hides the modal", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B", primaryText: "OK" });
        document.querySelector<HTMLButtonElement>("#modalPrimary")!.click();
        expect(document.querySelector("#modalOverlay")!.classList.contains("hidden")).toBe(true);
    });

    test("hides primary button when no primaryText given", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B" });
        expect(document.querySelector("#modalPrimary")!.classList.contains("hidden")).toBe(true);
    });

    test("shows secondary button and fires secondaryAction on click", () => {
        const partial = new Partial();
        const action = vi.fn();
        partial.showModal({
            title: "T",
            text: "B",
            secondaryText: "Cancel",
            secondaryAction: action,
        });

        const btn = document.querySelector<HTMLButtonElement>("#modalSecondary")!;
        expect(btn.classList.contains("hidden")).toBe(false);
        btn.click();
        expect(action).toHaveBeenCalledOnce();
    });

    test("re-calling showModal clears old button listeners before adding new ones", () => {
        const partial = new Partial();
        const first = vi.fn();
        const second = vi.fn();

        partial.showModal({ title: "T", text: "B", primaryText: "OK", primaryAction: first });
        partial.showModal({ title: "T", text: "B", primaryText: "OK", primaryAction: second });

        document.querySelector<HTMLButtonElement>("#modalPrimary")!.click();

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });
});

// ── hideModal ───────────────────────────────────────────────────────────────

describe("Partial.hideModal", () => {
    test("adds 'hidden' class to the overlay", () => {
        const partial = new Partial();
        partial.showModal({ title: "T", text: "B" });
        partial.hideModal();
        expect(document.querySelector("#modalOverlay")!.classList.contains("hidden")).toBe(true);
    });

    test("calling hideModal without showModal does not throw", () => {
        const partial = new Partial();
        expect(() => partial.hideModal()).not.toThrow();
    });
});

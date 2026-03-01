import { Socket } from "socket.io";
import { Store, GameState } from "./Store.js";
import { VIEWS } from "./util/ClientConstants.js";
import { Partial } from "./util/Partials.js";
import { RouerFn } from "./util/Types.js";

interface PageEvent {
    element: HTMLElement | null;
    event: string;
    callback: EventListener;
}

interface AppDomElements {
    gameContainer: HTMLElement;
    gameHeader: HTMLElement;
}

interface HeaderOptions {
    durationSeconds: number;
    timeoutMessage: string;
    description: string;
    backMessage: string;
}

interface SocketEvents {
    eventName: string;
    eventHandler: () => void;
}

export default abstract class Page {
    protected _events: PageEvent[] = [];
    protected _socketEvents: SocketEvents[] = [];
    protected _domElements: AppDomElements;
    protected _socket: Socket;
    protected _store: Store;
    protected go: RouerFn;
    protected _partial: Partial;

    private _unsubStore: (() => void) | null = null;
    private _timerInterval: ReturnType<typeof setInterval> | null = null;
    private _timerRemaining: number = 0;
    private _timerDuration: number = 90;
    private _headerTimerEl: HTMLElement | null = null;
    private _headerProgressEl: HTMLElement | null = null;

    constructor(socket: Socket, store: Store, router: RouerFn, partial: Partial) {
        this._socket = socket;
        this._store = store;
        this.go = router;
        this._partial = partial;

        this._domElements = {
            gameContainer: document.querySelector("#gameContainer") as HTMLElement,
            gameHeader: document.querySelector("#gameHeader") as HTMLElement,
        };
    }

    init() {
        this._events = [];
        this._socketEvents = [];
    }

    dispose__() {
        this._events.forEach(({ element, event, callback }) => {
            if (element) element.removeEventListener(event, callback);
        });

        this._socketEvents.forEach(({ eventName, eventHandler }) => {
            this._socket.off(eventName, eventHandler);
        });

        this._events = [];
        this._socketEvents = [];

        if (this._unsubStore) {
            this._unsubStore();
            this._unsubStore = null;
        }

        this._clearTimer__();
        this._domElements.gameHeader.innerHTML = "";
        this._headerTimerEl = null;
        this._headerProgressEl = null;
    }

    render__(state: GameState): void {}

    addEvents__(element: HTMLElement, event: string, callback: EventListener): void {
        this._events.push({ element, event, callback });
        element.addEventListener(event, callback);
    }

    addSocketEvents__(name: string, callback: (...args: any[]) => void): void {
        this._socketEvents.push({ eventName: name, eventHandler: callback });
        this._socket.on(name, callback);
    }

    /**
     * Scenario 1 — Timer expired.
     * Shows "Time's up" with Nazad (→ menu) and Sledeće (→ next()).
     */
    private _onTimerExpired__(timeoutMessage: string): void {
        this._clearTimer__();
        this._partial.showModal__({
            title: timeoutMessage,
            text: "Vreme je isteklo.",
            primaryText: "Nazad",
            secondaryText: "Sledeće",
            primaryAction: () => this.go(VIEWS.MENU),
            // Replace this.next__() once the method is implemented
            secondaryAction: () => this._next__(),
        });
    }

    /**
     * Scenario 2 — User pressed the header back button.
     * Shows a confirmation modal. Confirm navigates to menu; cancel just closes.
     */
    private _onBackButtonPressed__(backMessage: string): void {
        this._partial.showModal__({
            title: backMessage,
            text: "Da li ste sigurni da želite da napustite igru?",
            primaryText: "Odustani",   // closes modal, no navigation
            secondaryText: "Potvrdi",  // navigates away
            primaryAction: () => {},   // modal auto-closes; nothing else needed
            secondaryAction: () => {
                this._clearTimer__();
                this.go(VIEWS.MENU);
            },
        });
    }

    /**
     * Scenario 3 — Mini-game completed and result submitted.
     * Subclasses call this after the user submits their answer.
     * primaryAction: close modal (stay). secondaryAction: proceed with completion flow.
     */
    protected onGameComplete__(completionMessage: string = "Rezultat potvrđen!", onProceed?: () => void): void {
        this._clearTimer__();
        this._partial.showModal__({
            title: completionMessage,
            text: "Da li ste sigurni da želite da potvrdite rezultat?",
            primaryText: "Odustani",
            secondaryText: "Potvrdi",
            primaryAction: () => {},   // modal auto-closes; player can reconsider
            secondaryAction: () => {
                if (onProceed) {
                    onProceed();
                } else {
                    // Placeholder: replace with real completion flow
                    this._next__();
                }
            },
        });
    }

    /**
     * Placeholder for the next() navigation. Replace with real implementation.
     */
    protected _next__(): void {
        console.warn("_next__() not yet implemented — add logic here.");
        this.go(VIEWS.MOJ_BROJ);
    }

    protected initHeader__(options: HeaderOptions): void {
        const {
            durationSeconds = 90,
            description = "",
            timeoutMessage = "Vreme je isteklo!",
            backMessage = "Napusti igru?",
        } = options;

        this._timerDuration = durationSeconds;
        this._timerRemaining = durationSeconds;
        this._domElements.gameHeader.innerHTML = this._buildHeaderHTML__(durationSeconds);
        this._headerTimerEl = this._domElements.gameHeader.querySelector("#header-timer-count");
        this._headerProgressEl = this._domElements.gameHeader.querySelector("#header-progress-bar");

        const backBtn = this._domElements.gameHeader.querySelector("#header-back-btn") as HTMLElement;
        if (backBtn) {
            // Scenario 2 — back button click
            this.addEvents__(backBtn, "click", () => {
                this._onBackButtonPressed__(backMessage);
            });
        }

        this._timerInterval = setInterval(() => {
            this._timerRemaining--;

            if (this._headerTimerEl) {
                this._headerTimerEl.textContent = this._timerRemaining.toString();
            }

            if (this._headerProgressEl) {
                const pct = (this._timerRemaining / this._timerDuration) * 100;
                this._headerProgressEl.style.width = `${pct}%`;

                if (pct <= 20) {
                    this._headerProgressEl.classList.remove("bg-blue-400");
                    this._headerProgressEl.classList.add("bg-red-500");
                }
            }

            if (this._timerRemaining <= 0) {
                // Scenario 1 — timer expired
                this._onTimerExpired__(timeoutMessage);
            }
        }, 1000);
    }

    private _buildHeaderHTML__(duration: number): string {
        return `
            <div class="flex items-center gap-3 px-4 py-2 w-full max-w-2xl mx-auto border-b border-white/[0.06]">

                <button
                    id="header-back-btn"
                    class="flex items-center gap-1.5 px-3 py-2 text-[#80848e] hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] text-sm font-semibold rounded transition-colors shrink-0"
                >
                    <span>&#8592;</span>
                    <span>Nazad</span>
                </button>

                <div class="flex-1 h-1.5 bg-[#1e1f22] rounded-full overflow-hidden">
                    <div
                        id="header-progress-bar"
                        class="h-full bg-[#5865f2] rounded-full transition-all duration-1000 ease-linear"
                        style="width: 100%"
                    ></div>
                </div>

                <div class="flex items-center gap-2 px-3 py-2 bg-[#1e1f22] border border-white/[0.06] rounded shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-[#80848e]"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span id="header-timer-count" class="text-[#dbdee1] text-sm font-semibold min-w-[2ch] text-right">
                        ${duration}
                    </span>
                </div>

            </div>
        `;
    }

    private _clearTimer__(): void {
        if (this._timerInterval !== null) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    protected subscribeToStore__() {
        if (this._unsubStore) this._unsubStore();
        this._unsubStore = this._store.subscribe((state) => this.render__(state));

        const currentState = this._store.getState__();
        if (currentState) this.render__(currentState);
    }
}
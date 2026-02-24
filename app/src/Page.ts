import { Store, GameState } from "./Store.js";

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
    durationSeconds?: number;
    onTimeout?: () => void;
    alertMessage?: string;
}

/**
 * @description Base class for all pages in the application.
 * Provides common functionality for managing events, store subscription,
 * and an optional game header with countdown timer.
 */
export default abstract class Page {
    protected _events: PageEvent[] = [];
    protected _domElements: AppDomElements;
    protected _store: Store;
    private _unsubStore: (() => void) | null = null;

    private _timerInterval: ReturnType<typeof setInterval> | null = null;
    private _timerRemaining: number = 0;
    private _timerDuration: number = 90;
    private _headerTimerEl: HTMLElement | null = null;
    private _headerProgressEl: HTMLElement | null = null;

    constructor(store: Store) {
        this._store = store;
        this._domElements = {
            gameContainer: document.querySelector("#gameContainer") as HTMLElement,
            gameHeader: document.querySelector("#gameHeader") as HTMLElement,
        };
    }

    init() {}

    /**
     * @description Cleans up DOM events, store subscription, and the timer interval.
     */
    dispose__() {
        this._events.forEach(({ element, event, callback }) => {
            if (element) element.removeEventListener(event, callback);
        });
        this._events = [];

        if (this._unsubStore) {
            this._unsubStore();
            this._unsubStore = null;
        }

        this._clearTimer__();
        this._domElements.gameHeader.innerHTML = "";

        this._headerTimerEl = null;
        this._headerProgressEl = null;
    }

    render__(state: GameState): void {
        // Override in subclasses
    }

    addEvents__(element: HTMLElement, event: string, callback: EventListener): void {
        this._events.push({ element, event, callback });
        element.addEventListener(event, callback);
    }

    /**
     * @description Call this inside a subclass's init() to mount the header
     * with a countdown timer and back button into gameHeader.
     */
    protected initHeader__(options: HeaderOptions = {}): void {
        const { durationSeconds = 90, onTimeout, alertMessage = "Vreme je isteklo!" } = options;

        this._timerDuration = durationSeconds;
        this._timerRemaining = durationSeconds;

        this._domElements.gameHeader.innerHTML = this._buildHeaderHTML__(durationSeconds);

        this._headerTimerEl = this._domElements.gameHeader.querySelector("#header-timer-count");
        this._headerProgressEl = this._domElements.gameHeader.querySelector("#header-progress-bar");

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
                this._clearTimer__();
                window.alert(alertMessage);
                onTimeout?.();
            }
        }, 1000);
    }

    /**
     * @description Builds the header HTML string using Tailwind classes.
     * Progress bar sits between the back button and timer badge on the same row.
     */
    private _buildHeaderHTML__(duration: number): string {
        return `
            <div class="flex items-center gap-3 px-4 py-2">

                <button
                    id="header-back-btn"
                    class="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 
                           text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                >
                    <span>&#8592;</span>
                    <span>Nazad</span>
                </button>

                <!-- Progress bar track — grows to fill available space -->
                <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        id="header-progress-bar"
                        class="h-full bg-blue-400 rounded-full transition-all duration-1000 ease-linear"
                        style="width: 100%"
                    ></div>
                </div>

                <!-- Timer badge -->
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" 
                         fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span id="header-timer-count" class="text-white text-sm font-semibold min-w-[2ch] text-right">
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
        if (this._unsubStore) {
            this._unsubStore();
        }

        this._unsubStore = this._store.subscribe((state) => this.render__(state));

        const currentState = this._store.getState__();
        if (currentState) {
            this.render__(currentState);
        }
    }
}

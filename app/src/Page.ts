import { Socket } from "socket.io-client";
import { Store } from "./Store";
import { VIEWS } from "./util/ClientConstants";
import { ping } from "./util/Util";
import { I18nService } from "./util/I18n";
import App from "./App";

interface PageEvent {
    element: HTMLElement | null;
    event: string;
    callback: EventListener;
}

interface AppDomElements {
    gameContainer: HTMLElement;
    gameHeader: HTMLElement;
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
    protected _app: App;

    private _timerInterval: ReturnType<typeof setInterval> | null = null;
    private _timerRemaining: number = 0;
    private _timerDuration: number = 90;
    private _headerTimerEl: HTMLElement | null = null;
    private _headerProgressEl: HTMLElement | null = null;

    constructor(socket: Socket, store: Store, app: App) {
        this._socket = socket;
        this._store = store;
        this._app = app;

        this._domElements = {
            gameContainer: document.querySelector("#gameContainer") as HTMLElement,
            gameHeader: document.querySelector("#gameHeader") as HTMLElement,
        };
    }

    init() {
        this._events = [];
        this._socketEvents = [];
    }

    dispose() {
        this._events.forEach(({ element, event, callback }) => {
            if (element) element.removeEventListener(event, callback);
        });

        this._socketEvents.forEach(({ eventName, eventHandler }) => {
            this._socket.off(eventName, eventHandler);
        });

        this._events = [];
        this._socketEvents = [];

        this.clearTimer();
        this._domElements.gameHeader.innerHTML = "";
        this._headerTimerEl = null;
        this._headerProgressEl = null;
    }

    addEvents(element: HTMLElement, event: string, callback: EventListener): void {
        this._events.push({ element, event, callback });
        element.addEventListener(event, callback);
    }

    addSocketEvents(name: string, callback: (...args: any[]) => void): void {
        this._socketEvents.push({ eventName: name, eventHandler: callback });
        this._socket.on(name, callback);
    }

    private _onTimerExpired(): void {
        this.clearTimer();
        ping("timeExpired");
    }

    protected initHeader(duration: number = 90): void {
        this._timerDuration = duration;
        this._timerRemaining = duration;

        this._domElements.gameHeader.innerHTML = this._buildHeaderHTML(duration);
        I18nService.translate(this._domElements.gameHeader, "common");
        this._headerTimerEl = this._domElements.gameHeader.querySelector("#header-timer-count");
        this._headerProgressEl = this._domElements.gameHeader.querySelector("#header-progress-bar");

        const backBtn = this._domElements.gameHeader.querySelector(
            "#header-back-btn"
        ) as HTMLElement;
        this.addEvents(backBtn, "click", () => this._app.go(VIEWS.MENU));

        this._timerInterval = setInterval(() => {
            this._timerRemaining--;

            if (this._headerTimerEl) {
                this._headerTimerEl.textContent = this._timerRemaining.toString();
            }

            if (this._headerProgressEl) {
                const pct = (this._timerRemaining / this._timerDuration) * 100;
                this._headerProgressEl.style.width = `${pct}%`;

                if (pct <= 20) {
                    this._headerProgressEl.classList.remove("bg-brand");
                    this._headerProgressEl.classList.add("bg-content");
                }
            }

            if (this._timerRemaining <= 0) {
                this._onTimerExpired();
            }
        }, 1000);
    }

    private _buildHeaderHTML(duration: number): string {
        return `
            <div class="flex items-center gap-3 px-4 py-2 w-full max-w-2xl mx-auto border-b border-border-default">

                <button
                    id="header-back-btn"
                    class="flex items-center gap-1.5 px-3 py-2 text-content-muted hover:bg-surface-raised active:bg-surface-overlay text-sm font-semibold rounded transition-colors shrink-0"
                >
                    <span>&#8592;</span>
                    <span data-i18n="back">Nazad</span>
                </button>

                <div class="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                        id="header-progress-bar"
                        class="h-full bg-brand rounded-full transition-all duration-1000 ease-linear"
                        style="width: 100%"
                    ></div>
                </div>

                <div class="flex items-center gap-2 px-3 py-2 bg-surface border border-border-default rounded shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-content-muted"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span id="header-timer-count" class="text-content text-sm font-semibold min-w-[2ch] text-right">
                        ${duration}
                    </span>
                </div>

            </div>
        `;
    }

    protected clearTimer(): void {
        if (this._timerInterval !== null) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

}

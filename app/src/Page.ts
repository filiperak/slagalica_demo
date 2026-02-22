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

/**
 * @description Base class for all pages in the application.
 *  It provides common functionality for managing events and lifecycle of the page.
 */

export default abstract class Page {
    protected _events: PageEvent[] = [];
    protected _domElements: AppDomElements;
    protected _store: Store;
    private _unsubStore: (() => void) | null = null;

    constructor(store: Store) {
        this._store = store;
        this._domElements = {
            gameContainer: document.querySelector("#gameContainer") as HTMLElement,
            gameHeader: document.querySelector("#gameHeader") as HTMLElement,
        };
    }

    protected _subscribeToStore() {
        if (this._unsubStore) {
            this._unsubStore();
        }

        this._unsubStore = this._store.subscribe((state) => this.render(state));

        const currentState = this._store.getState__();
        if (currentState) {
            this.render(currentState);
        }
    }

    /**
     * @abstract Every page must implement its own render logic
     */
    render(state: GameState): void {
        //Do nothing for now
    }

    _addEvents(element: HTMLElement, event: string, callback: EventListener): void {
        this._events.push({ element, event, callback });
        element.addEventListener(event, callback);
    }

    /**
     * @description Cleanup handles both DOM events AND the Store subscription
     */
    _dispose() {
        this._events.forEach(({ element, event, callback }) => {
            if (element) element.removeEventListener(event, callback);
        });
        this._events = [];

        if (this._unsubStore) {
            this._unsubStore();
            this._unsubStore = null;
        }
    }
}

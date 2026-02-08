interface PageEvent {
    element: HTMLElement;
    event: string;
    callback: EventListener;
}

interface AppDomElements {
    gameContainer: HTMLElement | null;
    gameHeader: HTMLElement | null;
}

/**
 * @description Base class for all pages in the application.
 *  It provides common functionality for managing events and lifecycle of the page.
 */
export default class Page {

    _events: PageEvent[] = [];
    _domElements: AppDomElements;


    constructor() {
        this._events = [];
        this._domElements = {
            gameContainer: document.querySelector("#gameContainer"),
            gameHeader: document.querySelector("#gameHeader")
        }
    }

    init() {
        // Initialization logic
    }

    _addEvents(element: HTMLElement, event: string, callback: EventListener): void {
        this._events.push({ element, event, callback });
        
        element.addEventListener(event, callback);
    }

    /**
     * @description Disposes the page by removing all event listeners and clearing the events array.
     * This will be used any time the pange changes, Neccesary to prevent memory leaks and ensure that old event listeners do not interfere with the new page.
     */
    _dispose(): void {
        this._events.forEach(({ element, event, callback }) => {
            element.removeEventListener(event, callback);
        });
        this._events = [];
    }
}
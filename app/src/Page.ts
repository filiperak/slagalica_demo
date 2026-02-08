interface PageEvent {
    element: HTMLElement;
    event: string;
    callback: EventListener;
}

/**
 * @description Base class for all pages in the application.
 *  It provides common functionality for managing events and lifecycle of the page.
 */
class Page {

    _events: PageEvent[] = [];

    constructor() {
        this._events = [];
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
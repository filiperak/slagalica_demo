interface ModalOptions {
    title: string;
    text: string;
    primaryText?: string;
    secondaryText?: string;
    spinner?: boolean;
    primaryAction?: () => void;
    secondaryAction?: () => void;
}

interface PartialEvent {
    element: HTMLElement;
    event: string;
    callback: EventListener;
}

export class Partial {
    private _events: PartialEvent[] = [];
    private _elements: {
        overlay: HTMLDivElement;
        title: HTMLHeadingElement;
        text: HTMLParagraphElement;
        primaryBtn: HTMLButtonElement;
        secondaryBtn: HTMLButtonElement;
        spinner: HTMLDivElement;
    };

    constructor() {
        this._elements = {
            overlay: document.querySelector("#modalOverlay") as HTMLDivElement,
            title: document.querySelector("#modalTitle") as HTMLHeadingElement,
            text: document.querySelector("#modalText") as HTMLParagraphElement,
            primaryBtn: document.querySelector("#modalPrimary") as HTMLButtonElement,
            secondaryBtn: document.querySelector("#modalSecondary") as HTMLButtonElement,
            spinner: document.querySelector("#modalLoadingAnimation") as HTMLDivElement,
        };
    }

    private _addEvent(element: HTMLElement, event: string, callback: EventListener): void {
        this._events.push({ element, event, callback });
        element.addEventListener(event, callback);
    }

    private _clearEvents(): void {
        this._events.forEach(({ element, event, callback }) => {
            element.removeEventListener(event, callback);
        });
        this._events = [];
    }

    showModal__({
        title,
        text,
        primaryText,
        secondaryText,
        spinner = false,
        primaryAction,
        secondaryAction,
    }: ModalOptions) {
        this._clearEvents();

        this._elements.title.innerText = title;
        this._elements.text.innerText = text;

        const toggle = (el: Element, show: boolean) => el.classList.toggle("hidden", !show);

        toggle(this._elements.spinner, spinner);

        if (primaryText) {
            this._elements.primaryBtn.innerText = primaryText;
            toggle(this._elements.primaryBtn, true);
            this._addEvent(this._elements.primaryBtn, "click", () => {
                this.hideModal__();
                primaryAction?.();
            });
        } else {
            toggle(this._elements.primaryBtn, false);
        }

        if (secondaryText) {
            this._elements.secondaryBtn.innerText = secondaryText;
            toggle(this._elements.secondaryBtn, true);
            this._addEvent(this._elements.secondaryBtn, "click", () => {
                this.hideModal__();
                secondaryAction?.();
            });
        } else {
            toggle(this._elements.secondaryBtn, false);
        }

        this._elements.overlay.classList.remove("hidden");
    }

    hideModal__() {
        this._clearEvents();
        this._elements.overlay.classList.add("hidden");
    }
}
interface ModalOptions {
    title: string;
    text: string;
    buttonText?: string;
    callback?: () => void;
}

export class Partial {
    private _elements: {
        overlay: HTMLDivElement;
        title: HTMLHeadingElement;
        text: HTMLParagraphElement;
        button: HTMLButtonElement;
    };

    constructor() {
        this._elements = {
            overlay: document.querySelector("#modalOverlay") as HTMLDivElement,
            title: document.querySelector("#modalTitle") as HTMLHeadingElement,
            text: document.querySelector("#modalText") as HTMLParagraphElement,
            button: document.querySelector("#modalActionBtn") as HTMLButtonElement
        };

    }

    /**
     * Display the modal with custom content
     * @param options {title, text, buttonText, callback}
     */
    showModal__({ title, text, buttonText = "Zatvori", callback }: ModalOptions) {
        this._elements.title.innerText = title;
        this._elements.text.innerText = text;
        this._elements.button.innerText = buttonText;

        const newBtn = this._elements.button.cloneNode(true) as HTMLButtonElement;
        this._elements.button.parentNode?.replaceChild(newBtn, this._elements.button);
        this._elements.button = newBtn;

        this._elements.button.addEventListener("click", () => {
            this.hideModal__();
            if (callback) callback();
        });

        this._elements.overlay.classList.remove("hidden");
    }

    hideModal__() {
        this._elements.overlay.classList.add("hidden");
    }
}
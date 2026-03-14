/**
 *
 * @param {string} url - path to file
 * @returns Promise<string> - Resolves to sanitized HTML string or error message
 * @description Fetches HTML content from the specified URL and sanitizes it to prevent attacks.
 */
export const FetchHTML = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch HTML from ${url}: ${response.statusText}`);
        }

        const html = await response.text();

        return sanitizeHTML(html);
    } catch (error) {
        console.error(error);
        return `<div class="error">Error loading content</div>`;
    }
};

/**
 * @param {string} html - The raw HTML string to sanitize
 * @description Sanitizes HTML by removing script tags, event handler attributes, and dangerous URL schemes to prevent XSS attacks.
 * @returns
 */
const sanitizeHTML = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    doc.querySelectorAll("script").forEach((el) => el.remove());

    doc.querySelectorAll("*").forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith("on")) {
                el.removeAttribute(attr.name);
            }
        }

        ["href", "src", "action"].forEach((urlAttr) => {
            const value = el.getAttribute(urlAttr);

            if (value && value.trim().toLowerCase().startsWith("javascript:")) {
                el.removeAttribute(urlAttr);
            }
        });
    });

    doc.querySelectorAll("iframe, object, embed, form, base").forEach((el) => el.remove());

    return doc.body.innerHTML;
};

/**
 * Dispatches a custom event from a target (defaulting to window).
 * @param name - The unique string name of the event.
 * @param detail - The data payload to include in the event.
 * @param target - The DOM element to dispatch from (optional).
 */
export function emit<T>(name: string, detail: T, target: EventTarget = window): void {
  const event = new CustomEvent<T>(name, {
    detail,
    bubbles: true,
    cancelable: true,
    composed: true, 
  });

  target.dispatchEvent(event);
}

export function ping(name: string, target: EventTarget = document.body): void {
  target.dispatchEvent(new Event(name, { bubbles: true }));
}
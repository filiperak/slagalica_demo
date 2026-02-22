export const FetchHTML = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch HTML from ${url}: ${response.statusText}`);
        }

        const html = await response.text();
        return html;
    } catch (error) {
        console.error(error);
        return `<div class="error">Error loading content</div>`;
    }
};

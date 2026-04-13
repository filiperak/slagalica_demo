const THEME_KEY = "user-theme";
export type Theme = "light" | "dark";

export const ThemeService = {
    get(): Theme {
        return (localStorage.getItem(THEME_KEY) as Theme) ?? "light";
    },
    apply(theme: Theme): void {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(THEME_KEY, theme);
    },
    toggle(): Theme {
        const next = ThemeService.get() === "dark" ? "light" : "dark";
        ThemeService.apply(next);
        return next;
    },
};

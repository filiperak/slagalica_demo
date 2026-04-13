// @vitest-environment jsdom
import { ThemeService, Theme } from "../../app/src/util/ThemeService";

beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
});

describe("ThemeService.get", () => {
    test("returns 'light' when no value is stored", () => {
        expect(ThemeService.get()).toBe("light");
    });

    test("returns the stored theme from localStorage", () => {
        localStorage.setItem("user-theme", "light");
        expect(ThemeService.get()).toBe("light");
    });
});

describe("ThemeService.apply", () => {
    test("sets data-theme attribute on <html>", () => {
        ThemeService.apply("light");
        expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    test("persists the theme to localStorage", () => {
        ThemeService.apply("dark");
        expect(localStorage.getItem("user-theme")).toBe("dark");
    });

    test("applying 'light' then 'dark' updates both attribute and storage", () => {
        ThemeService.apply("light");
        ThemeService.apply("dark");
        expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
        expect(localStorage.getItem("user-theme")).toBe("dark");
    });
});

describe("ThemeService.toggle", () => {
    test("toggles from dark to light", () => {
        ThemeService.apply("dark");
        const next = ThemeService.toggle();
        expect(next).toBe("light");
        expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    test("toggles from light to dark", () => {
        ThemeService.apply("light");
        const next = ThemeService.toggle();
        expect(next).toBe("dark");
        expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    test("toggle persists the new value in localStorage", () => {
        ThemeService.apply("dark");
        ThemeService.toggle();
        expect(localStorage.getItem("user-theme")).toBe("light");
    });

    test("double toggle returns to original theme", () => {
        ThemeService.apply("dark");
        ThemeService.toggle();
        ThemeService.toggle();
        expect(ThemeService.get()).toBe("dark");
    });
});

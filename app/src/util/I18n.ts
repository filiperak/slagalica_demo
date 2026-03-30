import loby_sr from "../../public/i18n/loby/sr.json";
import menu_sr from "../../public/i18n/menu/sr.json";
import slagalica_sr from "../../public/i18n/slagalica/sr.json";
import mojBroj_sr from "../../public/i18n/mojBroj/sr.json";
import skocko_sr from "../../public/i18n/skocko/sr.json";
import koznazna_sr from "../../public/i18n/koznazna/sr.json";
import asocijacije_sr from "../../public/i18n/asocijacije/sr.json";

export type Lang = "sr" | "en";

type ViewKeyMap = {
    loby: keyof typeof loby_sr;
    menu: keyof typeof menu_sr;
    slagalica: keyof typeof slagalica_sr;
    mojBroj: keyof typeof mojBroj_sr;
    skocko: keyof typeof skocko_sr;
    koznazna: keyof typeof koznazna_sr;
    asocijacije: keyof typeof asocijacije_sr;
};

const LANG_KEY = "user-lang";
type TranslationMap = Record<string, string>;
const _cache: Record<string, TranslationMap> = {};
let _currentLang: Lang = (localStorage.getItem(LANG_KEY) as Lang) ?? "sr";

export const I18nService = {
    get(): Lang {
        return _currentLang;
    },

    set(lang: Lang): void {
        _currentLang = lang;
        localStorage.setItem(LANG_KEY, lang);
    },

    async load(view: string): Promise<void> {
        try {
            const res = await fetch(`/i18n/${view}/${_currentLang}.json`);
            if (!res.ok)
                throw new Error(
                    `i18n fetch failed: /i18n/${view}/${_currentLang}.json (${res.status})`
                );
            _cache[view] = await res.json();
        } catch (err) {
            console.error(err);
        }
    },

    translate(container: HTMLElement, view: string): void {
        const map = _cache[view];
        if (!map) return;

        container.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n!;
            if (key in map) el.textContent = map[key];
        });

        container.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
            const key = el.dataset.i18nPlaceholder!;
            if (key in map) (el as HTMLInputElement).placeholder = map[key];
        });

        container.querySelectorAll<HTMLElement>("[data-i18n-tip]").forEach((el) => {
            const key = el.dataset.i18nTip!;
            if (key in map) el.dataset.tip = map[key];
        });
    },

    getMessage<V extends keyof ViewKeyMap>(view: V, key: ViewKeyMap[V]): string {
        return _cache[view]?.[key as string] ?? (key as string);
    },
};

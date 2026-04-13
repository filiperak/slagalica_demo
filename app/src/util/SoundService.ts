const MUTED_KEY = "user-muted";

const _audio = new Audio("/assets/sounds/base-soundtrack.mp3");
_audio.loop = true;
_audio.volume = 0.4;

export const SoundService = {
    isMuted(): boolean {
        const stored = localStorage.getItem(MUTED_KEY);
        return stored === null ? true : stored === "true";
    },

    play(): void {
        if (!SoundService.isMuted()) {
            _audio.play().catch(() => {});
        }
    },

    toggle(): boolean {
        const next = !SoundService.isMuted();
        localStorage.setItem(MUTED_KEY, String(next));
        if (next) {
            _audio.pause();
        } else {
            _audio.play().catch(() => {});
        }
        return next;
    },
};

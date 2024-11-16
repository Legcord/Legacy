import type {Keybind} from "./keybind";
import type {Settings} from "./settings";

export interface LegcordWindow {
    window: {
        show: () => void;
        hide: () => void;
        minimize: () => void;
        maximize: () => void;
    };
    electron: string;
    setTrayIcon: (favicon: string) => void;
    getLang: (toGet: string) => Promise<string>;
    getDisplayMediaSelector: () => Promise<string>;
    version: string;
    platform: string;
    displayBalloon: (title: string, content: string) => void;
    openThemesWindow: () => void;
    openQuickCssFile: () => void;
    restart: () => void;
    translations: string;
    settings: {
        getConfig: () => Readonly<Settings>;
        setConfig: <K extends keyof Settings>(object: K, toSet: Settings[K]) => void;
        openStorageFolder: () => void;
        openThemesFolder: () => void;
        copyDebugInfo: () => void;
        copyGPUInfo: () => void;
        setLang(lang: string): () => void;
        addKeybind: (keybind: Keybind) => void;
        toggleKeybind: (id: string) => void;
        removeKeybind: (id: string) => void;
    };
}

declare global {
    interface Window {
        legcord: LegcordWindow;
    }
}

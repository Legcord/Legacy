import type {Keybind} from "./keybind";

export type ValidMods = "vencord" | "equicord" | "custom" | "shelter";

export interface Settings {
    // Referenced for detecting a broken config.
    "0"?: string;
    // Only used for external url warning dialog.
    ignoreProtocolWarning?: boolean;
    customIcon: string;
    windowStyle: "default" | "native" | "transparent";
    channel: "stable" | "ptb" | "canary";
    legcordCSP: boolean;
    minimizeToTray: boolean;
    multiInstance: boolean;
    spellcheck: boolean;
    mods: ValidMods[];
    mobileMode: boolean;
    legacyDynamicIcon: boolean;
    skipSplash: boolean;
    performanceMode: string;
    customJsBundle: RequestInfo | URL | string;
    customCssBundle: RequestInfo | URL | string;
    startMinimized: boolean;
    tray: boolean;
    keybinds: Keybind[];
    hardwareAcceleration: boolean;
    inviteWebsocket: boolean;
    disableAutogain: boolean;
    disableHttpCache: boolean;
    trayIcon:
        | "dynamic"
        | "dsc-tray"
        | "clsc-dsc-tray"
        | "ac_plug_colored"
        | "ac_white_plug"
        | "ac_white_plug_hollow"
        | "ac_black_plug"
        | "ac_black_plug_hollow"
        | "default"; // old configs DON'T USE
    clientName: string;
    smoothScroll: boolean;
    autoScroll: boolean;
    modCache?: Record<ValidMods, string>;
}

import * as fs from "fs";
import {app, dialog, globalShortcut} from "electron";
import path from "path";
import fetch from "cross-fetch";
import {Settings} from "./@types/settings";
import {runAction} from "./keybindActions";
import {setMenu} from "./menu";
import {Keybind} from "./@types/keybind";

export let contentPath: string;
export let transparency: boolean;
//utility functions that are used all over the codebase or just too obscure to be put in the file used in
export function addStyle(styleString: string): void {
    const style = document.createElement("style");
    style.textContent = styleString;
    document.head.append(style);
}

export function addScript(scriptString: string): void {
    let script = document.createElement("script");
    script.textContent = scriptString;
    document.body.append(script);
}

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkIfConfigIsBroken(): Promise<void> {
    try {
        let settingsData = fs.readFileSync(getConfigLocation(), "utf-8");
        JSON.parse(settingsData);
        console.log("Config is fine");
    } catch (e) {
        console.error(e);
        console.log("Detected a corrupted config");
        setup();
        dialog.showErrorBox(
            "Oops, something went wrong.",
            "Legcord has detected that your configuration file is corrupted, please restart the app and set your settings again. If this issue persists, report it on the support server/Github issues."
        );
    }
    try {
        let windowData = fs.readFileSync(getWindowStateLocation(), "utf-8");
        JSON.parse(windowData);
        console.log("Window config is fine");
    } catch (e) {
        console.error(e);
        fs.writeFileSync(getWindowStateLocation(), "{}", "utf-8");
        console.log("Detected a corrupted window config");
    }
}

export function setup(): void {
    console.log("Setting up temporary Legcord settings.");
    const defaults: Settings = {
        windowStyle: "default",
        channel: "stable",
        legcordCSP: true,
        minimizeToTray: true,
        keybinds: [],
        multiInstance: false,
        mods: [],
        spellcheck: true,
        performanceMode: "none",
        skipSplash: false,
        inviteWebsocket: true,
        startMinimized: false,
        legacyDynamicIcon: false,
        tray: true,
        customJsBundle: "https://legcord.app/placeholder.js",
        customCssBundle: "https://legcord.app/placeholder.css",
        disableAutogain: false,
        mobileMode: false,
        trayIcon: "default",
        clientName: "Legcord",
        customIcon: path.join(__dirname, "../", "/assets/desktop.png"),
        hardwareAcceleration: true,
        disableHttpCache: false,
        smoothScroll: false,
        autoScroll: false
    };
    setConfigBulk({
        ...defaults
    });
}

//Get the version value from the "package.json" file
export const packageVersion = require("../package.json").version;

export function getVersion(): string {
    return packageVersion;
}
export function getDisplayVersion(): string {
    return `Legacy Build`;
}
export async function injectJS(inject: string): Promise<void> {
    const js = await (await fetch(`${inject}`)).text();

    const el = document.createElement("script");

    el.appendChild(document.createTextNode(js));

    document.body.appendChild(el);
}
export async function injectElectronFlags(): Promise<void> {
    //     MIT License

    // Copyright (c) 2022 GooseNest

    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:

    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.

    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    // SOFTWARE.
    const presets = {
        performance: `--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --enable-hardware-overlays=single-fullscreen,single-on-top,underlay --enable-features=EnableDrDc,CanvasOopRasterization,BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation --disable-features=Vulkan --force_high_performance_gpu`, // Performance
        battery: "--enable-features=TurnOffStreamingMediaCachingOnBattery --force_low_power_gpu", // Known to have better battery life for Chromium?
        vaapi: "--ignore-gpu-blocklist --enable-features=VaapiVideoDecoder --enable-gpu-rasterization --enable-zero-copy --force_high_performance_gpu --use-gl=desktop --disable-features=UseChromeOSDirectVideoDecoder"
    };
    switch (await getConfig("performanceMode")) {
        case "performance":
            console.log("Performance mode enabled");
            app.commandLine.appendArgument(presets.performance);
            break;
        case "battery":
            console.log("Battery mode enabled");
            app.commandLine.appendArgument(presets.battery);
            break;
        default:
            console.log("No performance modes set");
    }
    if ((await getConfig("windowStyle")) == "transparent" && process.platform === "win32") {
        transparency = true;
    }
}
export async function setLang(language: string): Promise<void> {
    const langConfigFile = `${path.join(app.getPath("userData"), "/storage/")}lang.json`;
    if (!fs.existsSync(langConfigFile)) {
        fs.writeFileSync(langConfigFile, "{}", "utf-8");
    }
    let rawdata = fs.readFileSync(langConfigFile, "utf-8");
    let parsed = JSON.parse(rawdata);
    parsed.lang = language;
    let toSave = JSON.stringify(parsed, null, 4);
    fs.writeFileSync(langConfigFile, toSave, "utf-8");
}
let language: string;
export async function getLang(object: string): Promise<string> {
    if (language == undefined) {
        try {
            const userDataPath = app.getPath("userData");
            const storagePath = path.join(userDataPath, "/storage/");
            const langConfigFile = `${storagePath}lang.json`;
            let rawdata = fs.readFileSync(langConfigFile, "utf-8");
            let parsed = JSON.parse(rawdata);
            language = parsed.lang;
        } catch (_e) {
            console.log("Language config file doesn't exist. Fallback to English.");
            language = "en-US";
        }
    }
    if (language.length == 2) {
        language = `${language}-${language.toUpperCase()}`;
    }
    let langPath = path.join(__dirname, "../", `/assets/lang/${language}.json`);
    if (!fs.existsSync(langPath)) {
        langPath = path.join(__dirname, "../", "/assets/lang/en-US.json");
    }
    let rawdata = fs.readFileSync(langPath, "utf-8");
    let parsed = JSON.parse(rawdata);
    if (parsed[object] == undefined) {
        console.log(`${object} is undefined in ${language}`);
        langPath = path.join(__dirname, "../", "/assets/lang/en-US.json");
        rawdata = fs.readFileSync(langPath, "utf-8");
        parsed = JSON.parse(rawdata);
        return parsed[object];
    } else {
        return parsed[object];
    }
}
export async function getLangName(): Promise<string> {
    if (language == undefined) {
        try {
            const userDataPath = app.getPath("userData");
            const storagePath = path.join(userDataPath, "/storage/");
            const langConfigFile = `${storagePath}lang.json`;
            let rawdata = fs.readFileSync(langConfigFile, "utf-8");
            let parsed = JSON.parse(rawdata);
            language = parsed.lang;
        } catch (_e) {
            console.log("Language config file doesn't exist. Fallback to English.");
            language = "en-US";
        }
    }
    if (language.length == 2) {
        language = `${language}-${language.toUpperCase()}`;
    }
    return language;
}
//Legcord Window State manager
export interface WindowState {
    width: number;
    height: number;
    x: number;
    y: number;
    isMaximized: boolean;
}
function getWindowStateLocation() {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return `${storagePath}window.json`;
}
export async function setWindowState(object: WindowState): Promise<void> {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const saveFile = `${storagePath}window.json`;
    let toSave = JSON.stringify(object, null, 4);
    fs.writeFileSync(saveFile, toSave, "utf-8");
}
export async function getWindowState<K extends keyof WindowState>(object: K): Promise<WindowState[K]> {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}window.json`;
    if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, "{}", "utf-8");
    }
    let rawdata = fs.readFileSync(settingsFile, "utf-8");
    let returndata = JSON.parse(rawdata);
    console.log(`[Window state manager] ${returndata}`);
    return returndata[object];
}

export function getRawLang() {
    if (language === undefined) {
        try {
            const userDataPath = app.getPath("userData");
            const storagePath = path.join(userDataPath, "/storage/");
            const langConfigFile = `${storagePath}lang.json`;
            const rawData = fs.readFileSync(langConfigFile, "utf-8");
            const parsed = JSON.parse(rawData);
            language = parsed.lang;
        } catch (_e) {
            console.log("Language config file doesn't exist. Fallback to English.");
            language = "en-US";
        }
    }
    if (language.length === 2) {
        language = `${language}-${language.toUpperCase()}`;
    }
    let langPath = path.join(__dirname, "../", `/assets/lang/${language}.json`);
    if (!fs.existsSync(langPath)) {
        langPath = path.join(__dirname, "../", "/assets/lang/en-US.json");
    }
    const rawData = fs.readFileSync(langPath, "utf-8");
    const parsed = JSON.parse(rawData);
    return parsed;
}
//Legcord Settings/Storage manager

export function checkForDataFolder(): void {
    const dataPath = path.join(path.dirname(app.getPath("exe")), "legcord-data");
    if (fs.existsSync(dataPath) && fs.statSync(dataPath).isDirectory()) {
        console.log("Found legcord-data folder. Running in portable mode.");
        app.setPath("userData", dataPath);
    }
}

export function getConfigLocation(): string {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    return `${storagePath}settings.json`;
}
export async function getConfig<K extends keyof Settings>(object: K): Promise<Settings[K]> {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let returndata = JSON.parse(rawdata);
    console.log(`[Config manager] ${object}: ${returndata[object]}`);
    return returndata[object];
}
export function getConfigSync<K extends keyof Settings>(object: K) {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let returndata = JSON.parse(rawdata);
    console.log(`[Config manager] ${object}: ${returndata[object]}`);
    return returndata[object];
}
export async function setConfig<K extends keyof Settings>(object: K, toSet: Settings[K]): Promise<void> {
    let rawdata = fs.readFileSync(getConfigLocation(), "utf-8");
    let parsed = JSON.parse(rawdata);
    parsed[object] = toSet;
    let toSave = JSON.stringify(parsed, null, 4);
    fs.writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export async function setConfigBulk(object: Settings): Promise<void> {
    let existingData = {};
    try {
        const existingDataBuffer = fs.readFileSync(getConfigLocation(), "utf-8");
        existingData = JSON.parse(existingDataBuffer.toString());
    } catch (error) {
        // Ignore errors when the file doesn't exist or parsing fails
    }
    // Merge the existing data with the new data
    const mergedData = {...existingData, ...object};
    // Write the merged data back to the file
    const toSave = JSON.stringify(mergedData, null, 4);
    fs.writeFileSync(getConfigLocation(), toSave, "utf-8");
}
export async function checkIfConfigExists(): Promise<void> {
    const userDataPath = app.getPath("userData");
    const storagePath = path.join(userDataPath, "/storage/");
    const settingsFile = `${storagePath}settings.json`;

    if (!fs.existsSync(settingsFile)) {
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath);
            console.log("Created missing storage folder");
        }
        console.log("First run of the Legcord. Starting using default settings.");
        setup();
    } else {
        console.log("Legcord has been run before.");
    }
}

export let modInstallState: string;
export function updateModInstallState() {
    modInstallState = "modDownload";

    import("./extensions/plugin");

    modInstallState = "done";
}

export function addTheme(id: string, styleString: string): void {
    const style = document.createElement("style");
    style.textContent = styleString;
    style.id = id;
    document.head.append(style);
}
export async function registerGlobalKeybinds() {
    const keybinds = getConfig("keybinds");
    (await keybinds).forEach((keybind: Keybind) => {
        if (keybind.enabled && keybind.global) {
            globalShortcut.register(keybind.accelerator, () => {
                runAction(keybind);
            });
        }
    });
}
app.on("will-quit", () => {
    try {
        globalShortcut.unregisterAll();
    } catch (e) {}
});

export function refreshGlobalKeybinds() {
    console.log("[Keybind Manager] Refreshing keybinds");
    globalShortcut.unregisterAll();
    registerGlobalKeybinds();
    setMenu();
}

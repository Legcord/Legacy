//ipc stuff
import {app, clipboard, desktopCapturer, ipcMain, shell, SourcesOptions} from "electron";
import {
    getConfig,
    getConfigLocation,
    getDisplayVersion,
    getLang,
    getLangName,
    getRawLang,
    getVersion,
    refreshGlobalKeybinds,
    setConfig,
    setConfigBulk,
    setLang
} from "./utils";

import os from "os";
import fs from "fs";
import path from "path";
import {createTManagerWindow} from "./themeManager/main";
import {splashWindow} from "./splash/main";
import isDev from "electron-is-dev";
import type {Keybind} from "./@types/keybind.js";
import type {Settings} from "./@types/settings.js";
import {mainWindow} from "./window";

const userDataPath = app.getPath("userData");
const storagePath = path.join(userDataPath, "/storage/");
const themesPath = path.join(userDataPath, "/themes/");
const pluginsPath = path.join(userDataPath, "/plugins/");
const quickCssPath = path.join(userDataPath, "/quickCss.css");

function ifExistsRead(path: string): string | undefined {
    if (fs.existsSync(path)) return fs.readFileSync(path, "utf-8");
}

export function registerIpc(): void {
    ipcMain.handle("getShelterBundle", () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "shelter.js")),
            enabled: true
        };
    });
    ipcMain.handle("getVencordBundle", async () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "vencord.js")),
            css: ifExistsRead(path.join(app.getPath("userData"), "vencord.css")),
            enabled: (await getConfig("mods")).includes("vencord")
        };
    });
    ipcMain.handle("getEquicordBundle", async () => {
        return {
            js: ifExistsRead(path.join(app.getPath("userData"), "equicord.js")),
            css: ifExistsRead(path.join(app.getPath("userData"), "equicord.css")),
            enabled: (await getConfig("mods")).includes("equicord")
        };
    });
    ipcMain.handle("getCustomBundle", async () => {
        const enabled = (await getConfig("mods")).includes("custom");
        if (enabled) {
            return {
                js: ifExistsRead(path.join(app.getPath("userData"), "custom.js")),
                css: ifExistsRead(path.join(app.getPath("userData"), "custom.css")),
                enabled
            };
        }
    });
    ipcMain.on("splashEnd", async () => {
        splashWindow.close();
        if (await getConfig("startMinimized")) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
    ipcMain.on("setLang", (_event, lang: string) => {
        setLang(lang);
    });
    ipcMain.on("getLangSync", (event, toGet: string) => {
        event.reply("langString", getLang(toGet));
    });
    ipcMain.handle("getLang", (_event, toGet: string) => {
        return getLang(toGet);
    });

    ipcMain.on("win-maximize", () => {
        mainWindow.maximize();
    });
    ipcMain.on("win-isMaximized", (event) => {
        event.returnValue = mainWindow.isMaximized();
    });
    ipcMain.on("win-isNormal", (event) => {
        event.returnValue = mainWindow.isNormal();
    });
    ipcMain.on("win-minimize", () => {
        mainWindow.minimize();
    });
    ipcMain.on("win-unmaximize", () => {
        mainWindow.unmaximize();
    });
    ipcMain.on("win-show", () => {
        mainWindow.show();
    });
    ipcMain.on("win-hide", () => {
        mainWindow.hide();
    });
    ipcMain.on("win-quit", () => {
        app.quit();
    });
    ipcMain.on("get-app-version", (event) => {
        event.returnValue = getVersion();
    });
    ipcMain.on("displayVersion", (event) => {
        event.returnValue = getDisplayVersion();
    });
    ipcMain.on("restart", () => {
        app.relaunch();
        app.exit();
    });
    ipcMain.on("isDev", (event) => {
        event.returnValue = isDev;
    });
    ipcMain.on("setConfig", (_event, key: keyof Settings, value: string) => {
        setConfig(key, value);
    });
    ipcMain.on("addKeybind", async (_event, keybind: Keybind) => {
        const keybinds = await getConfig("keybinds");
        keybinds.push(keybind);
        setConfig("keybinds", keybinds);
        refreshGlobalKeybinds();
    });
    ipcMain.on("toggleKeybind", async (_event, id: string) => {
        const keybinds = await getConfig("keybinds");
        const keybind = keybinds[(await keybinds).findIndex((x) => x.id === id)];
        keybind.enabled = !keybind.enabled;
        setConfig("keybinds", keybinds);
        refreshGlobalKeybinds();
    });
    ipcMain.on("removeKeybind", async (_event, id: string) => {
        const keybinds = await getConfig("keybinds");
        (await keybinds).splice(
            (await keybinds).findIndex((x) => x.id === id),
            1
        );
        setConfig("keybinds", keybinds);
        refreshGlobalKeybinds();
    });
    ipcMain.on("getEntireConfig", (event) => {
        const rawData = fs.readFileSync(getConfigLocation(), "utf-8");
        event.returnValue = JSON.parse(rawData) as Settings;
    });
    ipcMain.on("getTranslations", (event) => {
        event.returnValue = getRawLang();
    });
    ipcMain.on("getConfig", (event, arg: any) => {
        event.returnValue = getConfig(arg);
    });
    ipcMain.on("openThemesWindow", () => {
        void createTManagerWindow();
    });
    // NOTE - I assume this would return sources based on the fact that the function only ingests sources
    ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (_event, opts: SourcesOptions) => desktopCapturer.getSources(opts));
    ipcMain.on("saveSettings", (_event, args: Settings) => {
        console.log(args);
        setConfigBulk(args);
    });
    ipcMain.on("openStorageFolder", () => {
        shell.showItemInFolder(storagePath);
    });
    ipcMain.on("openThemesFolder", () => {
        shell.showItemInFolder(themesPath);
    });
    ipcMain.on("openPluginsFolder", () => {
        shell.showItemInFolder(pluginsPath);
    });
    ipcMain.on("openQuickCssFile", () => {
        void shell.openPath(quickCssPath);
    });
    ipcMain.on("openCrashesFolder", () => {
        shell.showItemInFolder(path.join(app.getPath("temp"), `${app.getName()} Crashes`));
    });
    ipcMain.on("getLangName", (event) => {
        event.returnValue = getLangName();
    });
    ipcMain.on("crash", () => {
        process.crash();
    });
    ipcMain.on("getOS", (event) => {
        event.returnValue = process.platform;
    });
    ipcMain.on("copyDebugInfo", () => {
        const settingsFileContent = fs.readFileSync(getConfigLocation(), "utf-8");
        clipboard.writeText(
            `**OS:** ${os.platform()} ${os.version()}\n**Architecture:** ${os.arch()}\n**Legcord version:** ${getVersion()}\n**Electron version:** ${
                process.versions.electron
            }\n\`${settingsFileContent}\``
        );
    });
    ipcMain.on("copyGPUInfo", () => {
        clipboard.writeText(JSON.stringify(app.getGPUFeatureStatus()));
    });
}

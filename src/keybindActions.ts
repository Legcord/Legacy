import path from "node:path";
import {app, shell} from "electron";
import type {Keybind} from "./@types/keybind.js";
import {mainWindow} from "./window.js";
let isAudioEngineEnabled = false;

export function runAction(keybind: Keybind) {
    switch (keybind.action) {
        case "mute":
            muteToggle();
            break;
        case "deafen":
            deafenToggle();
            break;
        case "navigateBack":
            navigateBack();
            break;
        case "navigateForward":
            navigateForward();
            break;
        case "openQuickCss":
            openQuickCss();
            break;
        case "runJavascript":
            if (!keybind.js) break;
            runJavascript(keybind.js);
            break;
    }
}

function audioEngineCheck() {
    if (!isAudioEngineEnabled) {
        void mainWindow.webContents.executeJavaScript(`
                window.shelter.flux.dispatcher.dispatch({"type": "MEDIA_ENGINE_SET_AUDIO_ENABLED","enabled": true,"unmute": true });
            `);
        isAudioEngineEnabled = true;
    }
}
function muteToggle() {
    console.log("[Keybind action] Mute");
    audioEngineCheck();

    void mainWindow.webContents.executeJavaScript(`
                window.shelter.flux.dispatcher.dispatch({
                    "type": "AUDIO_TOGGLE_SELF_MUTE",
                    "context": "default",
                    "syncRemote": true,
                    "skipMuteUnmuteSoundEffect": false
                })
                `);
}

function deafenToggle() {
    console.log("[Keybind action] Deafen");
    audioEngineCheck();

    void mainWindow.webContents.executeJavaScript(`
        window.shelter.flux.dispatcher.dispatch({
            "type": "AUDIO_TOGGLE_SELF_DEAF",
            "context": "default",
            "syncRemote": true
        })
        `);
}

function navigateBack() {
    mainWindow.webContents.goBack();
}

function navigateForward() {
    mainWindow.webContents.goForward();
}

function openQuickCss() {
    void shell.openPath(path.join(app.getPath("userData"), "/quickCss.css"));
}

function runJavascript(js: string) {
    mainWindow.webContents.executeJavaScript(js);
}

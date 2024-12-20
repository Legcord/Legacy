// Modules to control application life and create native browser window
import {BrowserWindow, app, crashReporter, session} from "electron";
import "v8-compile-cache";
import {
    checkForDataFolder,
    checkIfConfigExists,
    checkIfConfigIsBroken,
    getConfig,
    getConfigSync,
    injectElectronFlags,
    setLang
} from "./utils";
import "./extensions/csp";
import "./protocol";
import "./tray";
import {createCustomWindow, createNativeWindow, createTransparentWindow} from "./window";
import path from "path";
import {createSplashWindow} from "./splash/main";
import {fetchMods} from "./extensions/mods";

export let iconPath: string;
export let settings: any;
export let customTitlebar: boolean;

app.on("render-process-gone", (event, webContents, details) => {
    if (details.reason == "crashed") {
        app.relaunch();
    }
});

if (!app.requestSingleInstanceLock() && getConfigSync("multiInstance") == false) {
    // if value isn't set after 3.2.4
    // kill if 2nd instance
    app.quit();
} else {
    app.commandLine.appendSwitch("disable-features", "WidgetLayering"); // fix dev tools layers
    // Your data now belongs to CCP
    crashReporter.start({uploadToServer: false});
    // enable pulseaudio audio sharing on linux
    if (process.platform === "linux") {
        app.commandLine.appendSwitch("enable-features", "PulseaudioLoopbackForScreenShare");
        app.commandLine.appendSwitch("disable-features", "WebRtcAllowInputVolumeAdjustment");
    }
    // enable webrtc capturer for wayland
    if (process.platform === "linux" && process.env.XDG_SESSION_TYPE?.toLowerCase() === "wayland") {
        app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
        console.log("Wayland detected, using PipeWire for video capture.");
    }
    // work around chrome 66 disabling autoplay by default
    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
    // WinRetrieveSuggestionsOnlyOnDemand: Work around electron 13 bug w/ async spellchecking on Windows.
    // HardwareMediaKeyHandling,MediaSessionService: Prevent Discord from registering as a media service.
    app.commandLine.appendSwitch(
        "disable-features",
        "WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService"
    );
    checkForDataFolder();
    checkIfConfigExists();
    checkIfConfigIsBroken();
    injectElectronFlags();
    app.whenReady().then(async () => {
        if ((await getConfig("customIcon")) !== undefined) {
            iconPath = await getConfig("customIcon");
        } else {
            iconPath = path.join(__dirname, "../", "/assets/desktop.png");
        }
        async function init(): Promise<void> {
            if ((await getConfig("skipSplash")) == false) {
                createSplashWindow();
            }
            await setLang("en-US");
            switch (await getConfig("windowStyle")) {
                case "default":
                    createCustomWindow();
                    customTitlebar = true;
                    break;
                case "native":
                    createNativeWindow();
                    break;
                case "transparent":
                    createTransparentWindow();
                    customTitlebar = true;
                    break;
                default:
                    createCustomWindow();
                    customTitlebar = true;
                    break;
            }
        }
        fetchMods();
        await init();
        session.fromPartition("some-partition").setPermissionRequestHandler((_webContents, permission, callback) => {
            if (permission === "notifications") {
                // Approves the permissions request
                callback(true);
            }
            if (permission === "media") {
                // Approves the permissions request
                callback(true);
            }
        });
        app.on("activate", function () {
            if (BrowserWindow.getAllWindows().length === 0) {
                void init();
            } else {
                BrowserWindow.getAllWindows().forEach((window) => {
                    window.show();
                });
            }
        });
    });
}

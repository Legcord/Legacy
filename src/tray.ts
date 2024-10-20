import {Menu, Tray, app, nativeImage} from "electron";
import {createInviteWindow, mainWindow} from "./window";
import {getConfig, getDisplayVersion} from "./utils";
import * as path from "path";
export let tray: any = null;
let trayIcon = "ac_plug_colored";
app.whenReady().then(async () => {
    if ((await getConfig("trayIcon")) != "default") {
        trayIcon = await getConfig("trayIcon");
    }
    let trayPath = nativeImage.createFromPath(path.join(__dirname, "../", `/assets/${trayIcon}.png`));
    let trayVerIcon;
    trayVerIcon = function () {
        if (process.platform == "win32") {
            return trayPath.resize({height: 16});
        } else if (process.platform == "darwin") {
            return trayPath.resize({height: 18});
        } else if (process.platform == "linux") {
            return trayPath.resize({height: 24});
        }
        return undefined;
    };

    if (process.platform == "darwin" && trayPath.getSize().height > 22) trayPath = trayPath.resize({height: 22});
    if (await getConfig("tray")) {
        let clientName = (await getConfig("clientName")) ?? "Legcord";
        tray = new Tray(trayPath);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: `${clientName} ${getDisplayVersion()}`,
                icon: trayVerIcon(),
                enabled: false
            },
            {
                type: "separator"
            },
            {
                label: `Open ${clientName}`,
                click() {
                    mainWindow.show();
                }
            },
            {
                label: "Open Settings",
                click() {
                    mainWindow.show();

                    void mainWindow.webContents.executeJavaScript(`window.shelter.flux.dispatcher.dispatch({
                                "type": "USER_SETTINGS_MODAL_OPEN",
                                "section": "My Account",
                                "subsection": null,
                                "openWithoutBackstack": false
                            })`);
                    void mainWindow.webContents.executeJavaScript(
                        `window.shelter.flux.dispatcher.dispatch({type: "LAYER_PUSH", component: "USER_SETTINGS"})`
                    );
                }
            },
            {
                label: "Support Discord Server",
                click() {
                    createInviteWindow("TnhxcqynZ2");
                }
            },
            {
                type: "separator"
            },
            {
                label: `Quit ${clientName}`,
                click() {
                    app.quit();
                }
            }
        ]);
        tray.setContextMenu(contextMenu);
        tray.setToolTip(clientName);
        tray.on("click", function () {
            mainWindow.show();
        });
    }
});

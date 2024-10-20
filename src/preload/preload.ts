import "./bridge.js";
import "./mods/shelter.js";
import "./mods/custom.js";
import "./mods/vencord.js";
import "./mods/equicord.js";
import "./optimizer.js";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {ipcRenderer} from "electron";
import type {LegcordWindow} from "../@types/legcordWindow.js";
import {injectTitlebar} from "./titlebar.js";
import {addScript, addStyle, addTheme, sleep} from "../utils.js";
declare global {
    interface Window {
        legcord: LegcordWindow;
    }
}
async function preload() {
    const version = ipcRenderer.sendSync("displayVersion") as string;
    console.log(`Legcord ${version}`);
    window.localStorage.setItem("hideNag", "true");
    console.warn("Using legacy capturer module");
    await import("./capturer.js");

    ipcRenderer.on("addTheme", (_event, name: string, css: string) => {
        if (document.getElementById(name)) return;
        addTheme(name, css);
    });
    ipcRenderer.on("removeTheme", (_event, name: string) => {
        document.getElementById(name)!.remove();
    });
    switch (ipcRenderer.sendSync("getConfig", "windowStyle")) {
        case "default":
            injectTitlebar(false);
            break;
        case "transparent":
            injectTitlebar(false);
            break;
        default:
            break;
    }

    await sleep(5000).then(() => {
        addScript(`
        (() => {
        const originalSetter = Object.getOwnPropertyDescriptor(Notification.prototype, "onclick").set;
        Object.defineProperty(Notification.prototype, "onclick", {
            set(onClick) {
            originalSetter.call(this, function() {
                onClick.apply(this, arguments);
                legcord.window.show();
            })
            },
            configurable: true
        });
        })();
        `);

        // remove the annoying "download the app" button
        addScript(
            "document.querySelector('.guilds_a4d4d9 .scroller_fea3ef').lastChild.previousSibling.style.display = 'none';"
        );
        addScript(`
        shelter.plugins.removePlugin("armcord-settings")
        shelter.plugins.removePlugin("armcord-screenshare")
    `);
        if (ipcRenderer.sendSync("getConfig", "disableAutogain")) {
            addScript(readFileSync(join(__dirname, "../", "/js/disableAutogain.js"), "utf8"));
        }
        addScript(readFileSync(join(__dirname, "../", "/js/rpc.js"), "utf8"));
        const cssPath = join(__dirname, "../", "/css/discord.css");
        addStyle(readFileSync(cssPath, "utf8"));
    });

    // Settings info version injection
    setInterval(() => {
        const host = document.querySelector('[class*="sidebar"] [class*="info"]');
        if (!host || host.querySelector("#ac-ver")) {
            return;
        }
        const el = host.firstElementChild!.cloneNode() as HTMLSpanElement;
        el.id = "ac-ver";
        el.textContent = `Legcord Version: ${version}`;
        host.append(el);
    }, 1000);
}
preload();

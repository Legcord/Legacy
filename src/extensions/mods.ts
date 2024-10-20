import {writeFileSync} from "node:fs";
import {join} from "node:path";
import {app} from "electron";
import fetch from "cross-fetch";
import {getConfig, setConfig} from "../utils";
import {Settings, ValidMods} from "../@types/settings";
export interface RepoData {
    owner: string;
    repo: string;
    branch: string;
}

export type ModData = Record<
    ValidMods,
    {
        repoData: RepoData;
        js: string;
        css?: string;
    }
>;

export const modData: ModData = {
    vencord: {
        repoData: {
            owner: "vendicated",
            repo: "vencord",
            branch: "main"
        },
        js: "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.js",
        css: "https://github.com/Vendicated/Vencord/releases/download/devbuild/browser.css"
    },
    equicord: {
        repoData: {
            owner: "equicord",
            repo: "equicord",
            branch: "main"
        },
        js: "https://github.com/Equicord/Equicord/releases/download/latest/browser.js",
        css: "https://github.com/Equicord/Equicord/releases/download/latest/browser.css"
    },
    shelter: {
        repoData: {
            owner: "uwu",
            repo: "shelter-builds",
            branch: "main"
        },
        js: "https://raw.githubusercontent.com/uwu/shelter-builds/main/shelter.js"
    },
    custom: {
        repoData: {
            owner: "DoNotChange",
            repo: "CustomMod",
            branch: "DoNotChange"
        },
        js: "DoNotChange"
    }
};
async function fetchMod(fileName: string, url: string) {
    try {
        await fetch(url).then(async (contents) => {
            const fileContent = await contents.text();
            if (!contents.ok || !fileContent) {
                throw new Error("BAD_RESPONSE");
            }
            writeFileSync(join(app.getPath("userData"), fileName), fileContent);
        });
    } catch (error) {
        console.error(error);
        console.error(`Something went wrong downloading ${fileName} from ${url} - skipping!`);
    }
}

async function getRef(repoData: RepoData) {
    return await fetch(
        `https://api.github.com/repos/${repoData.owner}/${repoData.repo}/git/matching-refs/heads/${repoData.branch}`
    )
        .then((response) => response.json())
        .then((data: {object: {sha: string}}[]) => {
            return data[0].object.sha;
        });
}

async function downloadMod(mod: ValidMods) {
    console.log(`[Mod Loader]: Downloading ${mod}...`);
    await fetchMod(`${mod}.js`, modData[mod].js);
    if (modData[mod].css) {
        // @ts-ignore
        await fetchMod(`${mod}.css`, modData[mod].css);
    }
}

async function cacheCheck(mod: ValidMods) {
    let modCache = await getConfig("modCache");
    if (!modCache) {
        modCache = new Object() as Settings["modCache"];
    }
    try {
        const latestRef = await getRef(modData[mod].repoData);
        if (latestRef === modCache![mod]) {
            console.log(`[Mod Loader]: ${mod} Cache hit!`);
            return;
        } else {
            downloadMod(mod);
            modCache![mod] = latestRef;
            setConfig("modCache", modCache);
        }
    } catch (e) {
        downloadMod(mod);
        console.error(`[Mod Loader] Failed to compare cache: ${e}`);
    }
}

export async function fetchMods() {
    if (typeof getConfig("mods") === "string") {
        await setConfig("mods", [getConfig("mods") as unknown as ValidMods]); // pre 3.3.2
    }
    await cacheCheck("shelter");
    (await getConfig("mods")).forEach(async (mod) => {
        if (mod === "custom") {
            await downloadMod(mod);
        }
        await cacheCheck(mod);
    });
}

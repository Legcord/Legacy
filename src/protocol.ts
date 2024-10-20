import path from "node:path";
import {app, protocol} from "electron";
protocol.registerSchemesAsPrivileged([
    {
        scheme: "legcord",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: false,
            bypassCSP: true,
            stream: true
        }
    }
]);

void app.whenReady().then(() => {
    protocol.registerFileProtocol("legcord", (req, callback) => {
        if (req.url.startsWith("legcord://plugins/")) {
            const url = req.url.replace("legcord://plugins/", "").split("/");
            const filePath = path.join(__dirname, "plugins", `/${url[0]}/${url[1]}`);
            if (filePath.includes("..")) {
                callback("bad");
                return;
            }
            callback(filePath);
            return;
        } else if (req.url.startsWith("legcord://assets/")) {
            const file = req.url.replace("legcord://assets/", "");
            const filePath = path.join(__dirname, "assets", "app", `${file}`);
            if (filePath.includes("..")) {
                callback("bad");
                return;
            }
            callback(filePath);
            return;
        } else if (req.url.startsWith("legcord://local/")) {
            const file = req.url.replace("legcord://local/", "");
            const userDataPath = path.join(app.getPath("userData"), "userAssets");
            const filePath = path.normalize(path.join(userDataPath, `${file}`));
            if (!filePath.startsWith(userDataPath)) {
                callback("bad");
                return;
            }
            callback(filePath);
            return;
        }
        callback("error");
    });
});

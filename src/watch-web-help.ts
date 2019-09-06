import * as fs from "fs";
import * as path from "path";

function getDateStr(): string {
    const dateStr: string = (new Date()).toTimeString();
    return `[${dateStr.substr(0, dateStr.indexOf(' '))}]`;
}

(async () => {
    const imperativePath = path.join(require("global-prefix"), "node_modules", "@zowe/imperative");
    if (!fs.existsSync(imperativePath)) {
        throw Error("@zowe/imperative must be installed as a global package");
    }

    const srcDir = path.join(fs.realpathSync(imperativePath), "web-help", "dist");
    const destDir = path.join(__dirname, "../dist");
    if (!fs.existsSync(destDir)) {
        throw Error("No web help found in " + destDir);
    }

    require("cpx").watch(srcDir.replace(/\\/g, '/') + "/**", destDir)
    .on("copy", (e: any) => {
        console.log(getDateStr(), "copy", e.srcPath, e.dstPath);
    }).on("remove", (e: any) => {
        console.log(getDateStr(), "remove", e.path);
    }).on("watch-ready", () => {
        console.log(getDateStr(), "watch-ready");
    }).on("watch-error", (err: any) => {
        console.log(getDateStr(), "watch-error", err);
    });
})().catch((error) => {
    console.error(error);
    process.exit(1);
});

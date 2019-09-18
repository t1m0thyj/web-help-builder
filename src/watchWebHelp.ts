import * as fs from "fs";
import * as path from "path";

const chalk = require("chalk");

function getDateStr(): string {
    const dateStr: string = (new Date()).toTimeString();
    return `[${chalk.gray(dateStr.substr(0, dateStr.indexOf(' ')))}]`;
}

(async () => {
    const imperativePath: string = path.join(require("global-prefix"), "node_modules", "@zowe/imperative");
    if (!fs.existsSync(imperativePath)) {
        throw Error("@zowe/imperative must be installed globally");
    }

    const srcDir: string = path.join(fs.realpathSync(imperativePath), "web-help", "dist");
    const destDir: string = path.join(__dirname, "../dist");
    if (!fs.existsSync(destDir)) {
        throw Error("No web help found in " + destDir);
    }

    console.clear();

    require("cpx").watch(srcDir.replace(/\\/g, '/') + "/**", destDir)
    .on("copy", (e: any) => {
        console.log(getDateStr(), "copy", e.srcPath, e.dstPath);
    }).on("remove", (e: any) => {
        console.log(getDateStr(), "remove", e.path);
    }).on("watch-ready", () => {
        console.log(getDateStr(), "watch-ready");
    }).on("watch-error", (err: any) => {
        console.error(getDateStr(), "watch-error", err);
    });
})().catch((error) => {
    console.error(error);
    process.exit(1);
});

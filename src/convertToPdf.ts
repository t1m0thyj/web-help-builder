import * as fs from "fs";
import * as path from "path";

(async () => {
    const distDir: string = path.join(__dirname, "../dist");
    if (!fs.existsSync(distDir)) {
        throw Error("No web help found in " + distDir);
    }

    const pdfFile: string = path.join(__dirname, "../dist/web-help.pdf");
    await require("chrome-headless-render-pdf").generateSinglePdf(`file:///${distDir}/docs/all.html`, pdfFile,
        {chromeBinary: require("chrome-finder")()});

    console.log("Output located in", distDir);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});

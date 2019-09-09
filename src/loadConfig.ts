import * as fs from "fs";
import * as path from "path";

interface IConfig {
    cliPackage: string;
    excludeGroups: string[];
    sanitizeHomeDir: boolean;
    useGlobalImperative: boolean;
}

const config: IConfig = require("js-yaml").safeLoad(fs.readFileSync(path.join(__dirname, "../config.yaml"), "utf8"));

if (!config.cliPackage) {
    throw Error("cliPackage must be set in config.yaml");
}

export default config;

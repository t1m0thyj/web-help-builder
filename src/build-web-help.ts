import * as fs from "fs";
import * as path from "path";
import { CommandResponse, WebHelpGenerator } from "../node_modules/@zowe/imperative";

interface IConfig {
    cliPackage: string;
    excludeGroups: string[];
}

(async () => {
    // Load and validate config
    const config: IConfig = require("js-yaml").safeLoad(fs.readFileSync(path.join(__dirname, "../config.yaml"), "utf8"));
    if (!config.cliPackage) {
        throw Error("cliPackage must be set in config.yaml");
    }
    let cliPackageDir: string = fs.realpathSync(path.join(__dirname, "node_modules", config.cliPackage));
    if (!fs.existsSync(cliPackageDir)) {
        throw Error("cliPackage must be installed in src/node_modules folder");
    }
    console.log("Loaded configuration from config.yaml");

    // Ensure output directory is empty
    const outDir: string = path.join(__dirname, "../dist");
    if (fs.existsSync(outDir)) {
        require("rimraf").sync(outDir);
    } else {
        fs.mkdirSync(outDir);
    }

    // Set paths to find Imperative for CLI package
    let imperativeImportPath: string = path.join(cliPackageDir, "../imperative");
    let imperativeRequirePath: string = path.join(cliPackageDir, "lib/imperative");

    // Import path is different if CLI package installed globally
    if (!fs.existsSync(imperativeImportPath)) {
        imperativeImportPath = path.join(cliPackageDir, "node_modules/@zowe/imperative");
    }

    // Get all command definitions
    const imperativeModule: any = await import(imperativeImportPath);
    const myConfig: any = imperativeModule.ImperativeConfig.instance;
    myConfig.loadedConfig = require(imperativeRequirePath);
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    const oldFilename: string = process.mainModule.filename;
    process.mainModule.filename = path.join(cliPackageDir, "package.json");
    // Initialize Imperative for commands to document
    await imperativeModule.Imperative.init(myConfig.loadedConfig);
    process.mainModule.filename = oldFilename;
    console.log(`Initialized Imperative for ${myConfig.callerPackageJson.name} ${myConfig.callerPackageJson.version}`);

    // Ensure required config values are defined
    if (myConfig.rootCommandName === undefined) {
        myConfig.rootCommandName = "zowe";
    }
    if (myConfig.loadedConfig.webHelpLogoImgPath === undefined) {
        myConfig.loadedConfig.webHelpLogoImgPath = path.join(__dirname, "../logo.png");
    }

    // Exclude undesired command groups
    const cmdDefinitions: any = imperativeModule.Imperative.fullCommandTree;
    cmdDefinitions.children = cmdDefinitions.children
        .filter((group: any) => (config.excludeGroups || []).indexOf(group.name) === -1);

    // Build command help pages
    const helpGenerator = new WebHelpGenerator(cmdDefinitions, myConfig, outDir);
    helpGenerator.sanitizeHomeDir = true;
    helpGenerator.buildHelp(new CommandResponse({ silent: false }));

    console.log("Output located in", outDir);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});

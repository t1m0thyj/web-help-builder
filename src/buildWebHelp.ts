import * as fs from "fs";
import * as path from "path";
import config from "./loadConfig";

(async () => {
    // Find and load Imperative web help builder
    let webHelpBuilderPath: string = path.join(__dirname, "../node_modules/imperative-latest");
    if (config.useGlobalImperative) {
        webHelpBuilderPath = path.join(require("global-prefix"), "node_modules", "@zowe/imperative");
        if (fs.existsSync(webHelpBuilderPath)) {
            console.log("Using globally installed @zowe/imperative");
        } else {
            throw Error("@zowe/imperative must be installed globally");
        }
    }
    const webHelpBuilder = require(webHelpBuilderPath);

    // Find paths where CLI package and Imperative are located
    let cliPackagePath: string;
    let imperativePath: string;
    cliPackagePath = path.join("../node_modules", config.cliPackage);
    imperativePath = path.join(cliPackagePath, "../imperative");
    if (fs.existsSync(cliPackagePath)) {
        console.log("Found", config.cliPackage, "installed locally");
    } else {
        cliPackagePath = path.join(require("global-prefix"), "node_modules", config.cliPackage);
        if (fs.existsSync(cliPackagePath)) {
            console.log("Found", config.cliPackage, "installed globally");
        } else {
            throw Error("Failed to find " + config.cliPackage);
        }
    }
    if (!fs.existsSync(imperativePath)) {
        imperativePath = path.join(cliPackagePath, "node_modules", config.cliPackage.substr(0, config.cliPackage.indexOf('/')), "imperative");
        process.mainModule.paths.push(path.join(cliPackagePath, "node_modules"));
    }

    // Ensure output directory is empty
    const outDir: string = path.join(__dirname, "../dist");
    if (fs.existsSync(outDir)) {
        require("rimraf").sync(outDir);
    } else {
        fs.mkdirSync(outDir);
    }

    // Get all command definitions
    const imperativeModule: any = await import(imperativePath);
    const myConfig: any = imperativeModule.ImperativeConfig.instance;
    myConfig.loadedConfig = require(path.join(cliPackagePath, "lib/imperative"));
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    const oldFilename: string = process.mainModule.filename;
    process.mainModule.filename = path.join(cliPackagePath, "package.json");
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
    const helpGenerator = new webHelpBuilder.WebHelpGenerator(cmdDefinitions, myConfig, outDir);
    helpGenerator.sanitizeHomeDir = config.sanitizeHomeDir;
    helpGenerator.buildHelp(new webHelpBuilder.CommandResponse({ silent: false }));

    console.log("Output located in", outDir);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});

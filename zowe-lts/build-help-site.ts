/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import * as fs from "fs";
import * as path from "path";
import marked from "marked";
import * as rimraf from "rimraf";
import { DefaultHelpGenerator, ICommandDefinition, Imperative, ImperativeConfig, IO } from "@brightside/imperative";

interface IPackageMetadata {
    name: string;
    version: string;
}

interface ITreeNode {
    id: string;
    text: string;
    children: undefined | ITreeNode[];
}

const treeNodes: ITreeNode[] = [];
const aliasList: { [key: string]: string[] } = {};

function genDocsHeader(title: string): string {
    return `<!DOCTYPE html>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>${title}</title>
<link rel="stylesheet" href="../node_modules/github-markdown-css/github-markdown.css">
<link rel="stylesheet" href="../css/docs.css">
<article class="markdown-body">
`;
}

function genBreadcrumb(baseName: string, fullCommandName: string): string {
    const crumbs: string[] = [];
    let hrefPrefix: string = "";
    [baseName, ...fullCommandName.split("_")].forEach((linkText: string) => {
        crumbs.push(`<a href="${hrefPrefix}${linkText}.html">${linkText}</a>`);
        hrefPrefix += `${linkText}_`;
    });
    return crumbs.join(" → ");
}

const docsFooter = `</article>
<link rel="stylesheet" href="../node_modules/balloon-css/balloon.min.css">
<script src="../node_modules/clipboard/dist/clipboard.js"></script>
<script src="../docs.js"></script>
`;

function processChildrenSummaryTables(helpGen: DefaultHelpGenerator, fullCommandName: string): string {
    const hrefPrefix = fullCommandName + "_";
    return helpGen.buildChildrenSummaryTables().split(/\r?\n/g)
        .slice(1)  // Delete header line
        .map((line: string) => {
            // Wrap group/command names inside links
            const match = line.match(/^\s*([a-z-]+(?:\s\|\s[a-z-]+)*)\s+[A-Z]/);
            if (match) {
                const href = `${hrefPrefix}${match[1].split(" ")[0]}.html`;
                return `\n* <a href="${href}">${match[1]}</a> -` + line.slice(match[0].length - 2);
            }
            return " " + line.trim();
        }).join("");
}

function genCommandHelpPage(definition: ICommandDefinition, fullCommandName: string, docsDir: string, homeDir: string, parentNode: ITreeNode) {
    const rootName: string = treeNodes[0].text;
    const helpGen = new DefaultHelpGenerator({
        produceMarkdown: true,
        rootCommandName: rootName
    } as any, {
        commandDefinition: definition,
        fullCommandTree: Imperative.fullCommandTree
    });

    let markdownContent = helpGen.buildHelp() + "\n";
    markdownContent = markdownContent.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (definition.type === "group") {
        // this is disabled for the CLIReadme.md but we want to show children here
        // so we'll call the help generator's children summary function even though
        // it's usually skipped when producing markdown
        markdownContent += `<h4>Commands</h4>\n` + processChildrenSummaryTables(helpGen, rootName + "_" + fullCommandName);
    }

    let htmlContent = genDocsHeader(fullCommandName.replace(/_/g, " "));
    htmlContent += `<h2>` + genBreadcrumb(rootName, fullCommandName) + `</h2>\n`;
    htmlContent += marked(markdownContent) + docsFooter;

    // Remove backslash escapes from URLs
    htmlContent = htmlContent.replace(/(%5C(?=.+?>.+?<\/a>)|\\(?=\..+?<\/a>))/g, "");

    // Sanitize references to user's home directory
    htmlContent = htmlContent.replace(new RegExp(homeDir.replace(/[\\/]/g, "."), "g"),
        homeDir.slice(0, homeDir.lastIndexOf(path.sep) + 1) + "&lt;user&gt;");

    // Add Copy buttons after command line examples
    htmlContent = htmlContent.replace(/<code>\$\s*(.*?)<\/code>/g,
        "<code>$1</code> <button class=\"btn-copy\" data-balloon-pos=\"right\" data-clipboard-text=\"$1\">Copy</button>");

    const helpHtmlFile = `${rootName}_${fullCommandName.trim()}.html`;
    const helpHtmlPath = path.join(docsDir, helpHtmlFile);
    fs.writeFileSync(helpHtmlPath, htmlContent);
    console.log("doc generated to " + helpHtmlPath);

    const childNode: ITreeNode = {
        id: helpHtmlFile,
        text: [definition.name, ...definition.aliases].join(" | "),
        children: []
    };
    parentNode.children.push(childNode);

    definition.aliases.forEach((alias: string) => {
        if (alias !== definition.name) {
            if (aliasList[alias] === undefined) {
                aliasList[alias] = [definition.name];
            } else if (aliasList[alias].indexOf(definition.name) === -1) {
                aliasList[alias].push(definition.name);
            }
        }
    });

    if (definition.children) {
        definition.children.forEach((child: any) => {
            genCommandHelpPage(child, `${fullCommandName}_${child.name}`, docsDir, homeDir, childNode);
        });
    }
}

function calcPackageMetadata(packageJson: any, pluginsJson: any): IPackageMetadata[] {
    return [
        { name: packageJson.name, version: packageJson.version },
        ...Object.keys(pluginsJson).map((name: any) => {
            return { name, version: pluginsJson[name].version };
        })
    ];
}

function eqPackageMetadata(cached: IPackageMetadata[], current: IPackageMetadata[]): boolean {
    return JSON.stringify(cached.sort((a, b) => a.name.localeCompare(b.name))) ===
        JSON.stringify(current.sort((a, b) => a.name.localeCompare(b.name)));
}

function writeTreeData(docsDir: string, config: ImperativeConfig) {
    const treeDataPath = path.join(docsDir, "..", "tree-data.js");
    fs.writeFileSync(treeDataPath,
        "/* This file is automatically generated, do not edit manually! */\n" +
        "const treeNodes = " + JSON.stringify(treeNodes, null, 2) + ";\n" +
        "const aliasList = " + JSON.stringify(aliasList, null, 2) + ";\n" +
        `const headerStr = "${config.loadedConfig.productDisplayName}";\n` +
        `const footerStr = "${config.callerPackageJson.name} ${config.callerPackageJson.version}";\n`);
}

(async () => {
    const docsDir = path.join(__dirname, "..", "help-site", "doc");
    IO.createDirsSync(docsDir);
    const cliPackageDir = "node_modules/@brightside/core";

    // Get all command definitions
    const myConfig = ImperativeConfig.instance;
    myConfig.loadedConfig = require(`./${cliPackageDir}/lib/imperative`);
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    process.mainModule.filename = __dirname + `/${cliPackageDir}/package.json`;
    // Initialize Imperative for commands to document
    await Imperative.init(myConfig.loadedConfig);

    const metadataFile = path.join(docsDir, "..", "metadata.json");
    let cachedMetadata: IPackageMetadata[] = [];
    if (fs.existsSync(metadataFile)) {
        cachedMetadata = JSON.parse(fs.readFileSync(metadataFile).toString());
    }
    const currentMetadata: IPackageMetadata[] = calcPackageMetadata(myConfig.callerPackageJson,
        JSON.parse(fs.readFileSync(path.join(myConfig.cliHome, "plugins", "plugins.json")).toString())
    );
    if (eqPackageMetadata(cachedMetadata, currentMetadata)) {
        console.log("Nothing has changed, skipping help generation");
        return;
    }

    rimraf.sync(docsDir + path.sep + "*");
    fs.writeFileSync(metadataFile, JSON.stringify(currentMetadata, null, 2));

    const uniqueDefinitions = Imperative.fullCommandTree;
    uniqueDefinitions.children = uniqueDefinitions.children
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((item, pos, self) => self.indexOf(item) === pos);  // Remove duplicate items

    const rootName: string = "zowe";  // TODO Get this string from imperative
    const rootHelpHtmlPath = path.join(docsDir, `${rootName}.html`);
    treeNodes.push({ id: `${rootName}.html`, text: rootName, children: [] });

    let rootHelpContent = genDocsHeader(rootName);
    rootHelpContent += `<h2><a href="${rootName}.html">${rootName}</a></h2>\n`;
    rootHelpContent += marked(myConfig.loadedConfig.rootCommandDescription) + "\n";
    const helpGen = new DefaultHelpGenerator({
        produceMarkdown: true,
        rootCommandName: rootName
    } as any, {
        commandDefinition: uniqueDefinitions,
        fullCommandTree: uniqueDefinitions
    });
    rootHelpContent += marked(`<h4>Groups</h4>\n` + processChildrenSummaryTables(helpGen, rootName));
    rootHelpContent += docsFooter;
    fs.writeFileSync(rootHelpHtmlPath, rootHelpContent);

    uniqueDefinitions.children.forEach((def) => {
        genCommandHelpPage(def, def.name, docsDir, path.dirname(myConfig.loadedConfig.defaultHome), treeNodes[0]);
    });

    console.log("Generated documentation pages for all commands and groups");
    writeTreeData(docsDir, myConfig);
})();

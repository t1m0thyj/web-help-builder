# web-help-builder

Tools for building and developing [Zowe CLI](https://github.com/zowe/zowe-cli) web help

## No Longer Maintained

Try these alternatives instead:

* Build - Install desired version of Zowe CLI in Docker container and run `zowe --help-web`
* Watch - Run this command in Imperative repo: `npx cpx "web-help/dist/**" ~/.zowe/web-help --watch -v`

## Installation

1. Clone this repo
2. Run `npm install`
3. Create `config.yaml` based off of `example.config.yaml`

## Usage

### Building web help

The following NPM scripts are available:

* `build` - Build web help for the CLI package defined in `config.yaml`
* `build:bright` - Build web help for `@zowe/cli` package
* `build:zowe` - Build web help for `@brightside/core` package
* `clean` - Remove contents of `dist` folder

To build web help for `@latest` branch:
```bash
npm install @zowe/cli@latest --no-save
npm run build:zowe
```

To build web help for `@lts-incremental` branch:
```bash
npm install @brightside/core@lts-incremental --no-save
npm run build:bright
```

If you want to build web help for a CLI package that is installed globally, the `npm install` step is unnecessary.

### Developing web help

The NPM `watch` script can be used to test changes made to web help source files in [Imperative](https://github.com/zowe/imperative). It copies files from the `web-help/dist` folder in the Imperative repo to the `dist` folder in this repo. This requires that you have the `@zowe/imperative` package installed or linked globally, and have already built web help into the `dist` folder.

While the `watch` script is running, you can open `dist/index.html` in your web browser and refresh it to see new changes. You can also use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code to host the HTML page locally on your machine and automatically refresh when changes are detected.

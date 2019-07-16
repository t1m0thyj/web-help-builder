# web-help-builder

## DEPRECATED

This repo is no longer the recommended method for building Zowe web help. Use the [build-web-help](https://github.com/zowe/zowe-cli/tree/build-web-help) branch of Zowe and the [HelpBrowser](https://github.com/zowe/imperative/tree/HelpBrowser) branch of Imperative instead. The "web-help" folder in the Zowe repo contains a script that can be run with `npm run build:webHelp` and configured with `config.json`.

## Building web help

### Zowe LTS (@brightside/core)

Clone this repo and run the following commands:
```bash
cd help-site
# compile Typescript for help site
npm run build
cd ../zowe-lts
npm install @brightside/core@lts-incremental
# ewoz is a shell script that runs Zowe from the node_modules directory instead of your system installed Zowe
./ewoz plugins install @brightside/cics@lts-incremental @brightside/db2@lts-incremental
# build the docs, convert them into a format to be distributed, and bundle them into a zip
npm run build && npm run dist && npm run zip
```

The output will be in `zowe-lts/dist` and `zowe-lts/zowe_web_help.zip`.

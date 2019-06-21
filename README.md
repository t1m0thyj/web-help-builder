# web-help-builder

## Building web help

### Zowe LTS (@brightside/core)

Clone this repo and run the following commands:
```bash
cd zowe-lts
npm install @brightside/core@lts-incremental
# ewoz is a shell script that runs Zowe from the node_modules directory instead of your system installed Zowe
./ewoz plugins install @brightside/cics@lts-incremental @brightside/db2@lts-incremental
# build the docs, convert them into a format to be distributed, and bundle them into a zip
npm run build && npm run dist && npm run zip
```

The output will be in `zowe-lts/dist` and `zowe-lts/zowe_web_help.zip`.

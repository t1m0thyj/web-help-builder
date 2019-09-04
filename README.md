# web-help-builder

Tools for building and developing [Zowe CLI](https://github.com/zowe/zowe-cli) web help

## Installation

1. Clone this repo
2. Run `npm install`
3. Create `config.yaml` based off of `example.config.yaml`

## Usage

### Building web help

The following `npm` commands are available:

* `npm run build:latest` - Build web help for @zowe/cli@latest
* `npm run build:lts` - Build web help for @brightside/core@lts-incremental
* `npm run build` - Build web help for a specific version of the CLI (see the docs at the top of `config.yaml` for how to configure it)
* `npm run clean` - Remove contents of "dist" and "src/node_modules" folders

### Developing web help

TODO

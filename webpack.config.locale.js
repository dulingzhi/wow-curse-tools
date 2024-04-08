// @ts-check

"use strict";

const path = require("path");

/** @type {import('webpack').Configuration} */
const config = {
    target: "node",

    entry: {
        index: "./src/actions/locale.ts",
    },
    output: {
        path: path.resolve(__dirname, "../curse-locale"),
        filename: "[name].js",
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".js"],
        modules: ["node_modules"],
    },
    module: {
        unknownContextCritical: false,
        exprContextCritical: false,
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
            {
                test: /\.lua$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "raw-loader",
                    },
                ],
            },
        ],
    },
    externals: {
        wasmoon: "./wasmoon",
    },
};

require("./copy")(config.output.path);

module.exports = config;

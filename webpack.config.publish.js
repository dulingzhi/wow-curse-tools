// @ts-check

"use strict";

const path = require("path");

/** @type {import('webpack').Configuration} */
const config = {
    target: "node",

    entry: {
        index: "./src/actions/publish.ts",
    },
    output: {
        path: path.resolve(__dirname, "../curse-publish-action"),
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
    }
};

module.exports = config;

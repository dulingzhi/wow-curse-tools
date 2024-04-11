// @ts-check

"use strict";

const path = require("path");

/** @type {import('webpack').Configuration} */
const config = {
    target: "node",

    entry: {
        exec: "./src/exec.ts",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
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
            {
                test: /\.proto$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "protobufjs-loader",
                        options: {
                            paths: ["src/lib/proto/product.proto"],
                            pbjsArgs: ["--no-encode"],
                            pbts: {
                                args: ["--no-comments"],
                            },
                        },
                    },
                ],
            },
        ],
    },
    externals: {
        wasmoon: "wasmoon",
    },
};
module.exports = config;

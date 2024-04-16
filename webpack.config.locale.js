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
        path: path.resolve(__dirname, "actions/locale"),
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
    externals: [
        function ({ request }, callback) {
            if (request === "wasmoon") {
                require("./copy")(module.exports.output.path);
                return callback(null, "./wasmoon");
            }
            callback();
        },
    ],
};

module.exports = config;

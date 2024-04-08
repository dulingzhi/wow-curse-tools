#!/usr/bin/env node
/**
 * @File   : copy.js
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/8/2024, 7:51:22 PM
 */

const fs = require("fs");
const path = require("path");

module.exports = function (dist) {
    try {
        fs.copyFileSync("node_modules/wasmoon/dist/glue.wasm", path.join(dist, "glue.wasm"));
        fs.copyFileSync("node_modules/wasmoon/dist/index.js", path.join(dist, "wasmoon.js"));
        console.log("Copy success");
    } catch {
        console.error("Copy failed");
    }
};

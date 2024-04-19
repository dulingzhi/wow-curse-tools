/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:55:11 PM
 */

import { Update } from '../commands/update';
import core = require('@actions/core');

async function main() {
    const token = core.getInput('curse-forge-token', { required: true });
    const githubToken = core.getInput('github-token');

    if (token) {
        process.env.CURSE_FORGE_TOKEN = token;
    }
    if (githubToken) {
        process.env.GITHUB_TOKEN = githubToken;
    }
    await new Update().run();
}

main();

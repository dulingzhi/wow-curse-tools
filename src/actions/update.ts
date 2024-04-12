/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:55:11 PM
 */

import * as core from '@actions/core';
import { Update } from '../commands/update';

async function main() {
    const root = core.getInput('root', { required: true });
    await new Update().run(root);
}

main();

/**
 * @File   : package.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 12/23/2024, 3:31:22 PM
 */

import { Package } from '../commands/package';

async function run() {
    const app = new Package();
    await app.run();
}

run();

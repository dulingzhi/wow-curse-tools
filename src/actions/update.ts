/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:55:11 PM
 */

import { Update } from '../commands/update';

async function main() {
    await new Update().run();
}

main();

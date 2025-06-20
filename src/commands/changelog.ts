/**
 * @File   : changelog.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/20/2025, 11:24:57 AM
 */

import * as fs from 'fs-extra';
import { convertChangelogToBBCode } from '../lib/util';

export class ChangeLog {

    async run() {
        const ctx = convertChangelogToBBCode(await fs.readFile('CHANGELOG.md', { encoding: 'utf-8' }));
        console.log(ctx);
    }
}

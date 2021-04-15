/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/30/2019, 9:28:47 AM
 */

import * as fs from 'fs-extra';

export async function readLocale(file: string) {
    const content = await fs.readFile(file, { encoding: 'utf-8' });
    const m = content.match(/--\s*@import@((.|\r|\n)+)--\s*@end-import@/);
    if (!m) {
        return;
    }
    return m[1];
}

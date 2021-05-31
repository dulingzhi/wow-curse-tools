/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/30/2019, 9:28:47 AM
 */

import { readFile } from './util';

export async function readLocale(filePath: string) {
    const content = await readFile(filePath);
    const m = content.match(/--\s*@import@((.|\r|\n)+)--\s*@end-import@/);
    if (!m) {
        return;
    }
    return m[1];
}

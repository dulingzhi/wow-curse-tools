/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/30/2019, 9:28:47 AM
 */

import { readFile } from './util';

export interface LocaleArgs {
    language: string;
}
export interface ImportInfo {
    body: string;
    args: LocaleArgs;
}

function parseArgs(args: string): LocaleArgs {
    return {
        language: args
            .split(';')
            .map((x) => x.split('=', 2) as [string, string])
            .find(([k]) => k === 'language')![1],
    };
}

export async function readLocale(filePath: string): Promise<ImportInfo | undefined> {
    const content = await readFile(filePath);
    const m = content.match(/--\s*@import:(?<args>.+)@(?<body>(.|\r|\n)+)--\s*@end-import@/);
    if (!m || !m.groups) {
        return;
    }
    return { body: m.groups.body, args: parseArgs(m.groups.args) };
}

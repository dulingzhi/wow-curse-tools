/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:30:57 PM
 */
import * as path from 'path';
import { CodeFilesFinder } from './code';
import { ResFilesFinder } from './res';

export interface File {
    file: string;
    relative: string;
}

export async function findFiles(folder: string, name: string): Promise<File[]> {
    return [
        ...(await new CodeFilesFinder().findFiles(path.resolve(folder, name + '.toc'))),
        ...(await new ResFilesFinder().findFiles(folder)),
    ].map((file) => ({ file, relative: path.join(name, path.relative(folder, file)) }));
}

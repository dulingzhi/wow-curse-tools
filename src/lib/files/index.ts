/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:30:57 PM
 */
import * as path from 'path';
import { CodeFilesFinder } from './code';
import { ResFilesFinder } from './res';

export interface Remote {
    type: 'curse' | 'github';
    repo: string;
    path: string;
    tag?: string;
}

export interface File {
    path: string;
    relative: string;
}

export async function findFiles(folder: string, name: string, fetchRemote = false, excludePath: string[] = []): Promise<File[]> {
    const filePaths = [
        ...(await new CodeFilesFinder(fetchRemote).findFiles(path.resolve(folder, name + '.toc'))),
        ...(await new ResFilesFinder().findFiles(folder, excludePath)),
    ];

    return filePaths.map((filePath) => ({
        path: filePath,
        relative: path.join(name, path.relative(folder, filePath)),
    }));
}

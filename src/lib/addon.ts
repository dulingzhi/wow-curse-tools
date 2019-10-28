/**
 * @File   : addon.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 5:35:28 PM
 */

import * as path from 'path';
import { FilesReader } from './files';
import { Resources } from './resources';

export class Addon {
    name: string;
    folder: string;
    private ignores: string[];

    constructor(name: string, folder: string, ignores: string[] = []) {
        this.name = name;
        this.folder = folder;
        this.ignores = ignores;
    }

    async getFiles() {
        const filesReader = new FilesReader(path.resolve(this.folder, this.name + '.toc'));
        const resourceReader = new Resources(this.folder, this.ignores);

        return [...(await filesReader.getFiles()), ...(await resourceReader.getFiles())];
    }
}

/**
 * @File   : resources.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 3:18:59 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

export class Resources {
    private folder: string;
    private ignores: Set<string>;
    private files = new Set<string>();
    private exts = new Set(['.blp', '.tga', '.m2']);

    constructor(folder: string, ignores: string[]) {
        this.folder = folder;
        this.ignores = new Set(ignores.map(f => path.resolve(f).toLowerCase()));
    }

    async run() {
        await this.walk(this.folder);
    }

    async walk(folder: string) {
        if (this.ignores.has(folder.toLowerCase())) {
            return;
        }
        const files = (await fs.readdir(folder))
            .filter(name => !name.startsWith('.'))
            .map(name => path.resolve(folder, name))
            .filter(file => !this.ignores.has(file.toLowerCase()));

        for (const file of files) {
            const stat = await fs.stat(file);

            if (stat.isDirectory()) {
                await this.walk(file);
            } else if (this.isResource(file)) {
                this.files.add(file);
            }
        }
    }

    isResource(file: string) {
        if (/^license\./i.test(path.basename(file))) {
            return true;
        }
        if (this.exts.has(path.extname(file).toLowerCase())) {
            return true;
        }
        return false;
    }

    async getFiles() {
        await this.run();
        return this.files;
    }
}

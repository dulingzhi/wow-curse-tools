/**
 * @File   : res.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:27:46 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

export class ResFilesFinder {
    private _files = new Set<string>();
    private exts = new Set(['.blp', '.tga', '.m2']);

    private isResource(file: string) {
        const baseName = path.basename(file);
        if (/^license/i.test(baseName)) {
            return true;
        }
        if (/^bindings\.xml$/i.test(baseName)) {
            return true;
        }
        if (this.exts.has(path.extname(file).toLowerCase())) {
            return true;
        }
        return false;
    }

    private async walk(folder: string) {
        const files = (await fs.readdir(folder))
            .filter((name) => !name.startsWith('.') && !/^node_modules$/i.test(name))
            .map((name) => path.resolve(folder, name));

        for (const file of files) {
            const stat = await fs.stat(file);

            if (stat.isDirectory()) {
                await this.walk(file);
            } else if (this.isResource(file)) {
                this._files.add(file);
            }
        }
    }

    async findFiles(folder: string) {
        await this.walk(folder);
        return this._files;
    }
}

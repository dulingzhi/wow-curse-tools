/**
 * @File   : addon.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:45:40 PM
 */

import { ZipFile } from 'yazl';
import { findFiles } from './files';

import { gProject } from './project';
import { compileFile } from './compiler';

export class Addon {
    private zipFile = new ZipFile();

    get outputStream() {
        return this.zipFile.outputStream;
    }

    async flush() {
        for (const addon of gProject.addons) {
            const files = await findFiles(addon.folder, addon.name);

            for (const file of files) {
                const content = await compileFile(file.file);
                if (content) {
                    this.zipFile.addBuffer(Buffer.from(content, 'utf-8'), file.relative);
                } else {
                    this.zipFile.addFile(file.file, file.relative);
                }
            }
        }

        this.zipFile.end();
    }
}

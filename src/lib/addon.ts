/**
 * @File   : addon.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:45:40 PM
 */

import * as fs from 'fs-extra';

import { ZipFile } from 'yazl';

import { Project } from './project';
import { gCompilerManager } from './compiler';
import { gEnv } from './env';
import { findFiles } from './files';

export class AddonFlusher {
    private zipFile = new ZipFile();

    constructor(private project: Project, buildId: string) {
        const env = project.buildEnvs.get(buildId);
        if (!env) {
            throw Error('not found env');
        }
        gEnv.setEnv(env);
    }

    private async writeZip(zip: ZipFile, output: fs.WriteStream) {
        return new Promise<void>((resolve) => {
            zip.outputStream.pipe(output).on('close', () => resolve());
        });
    }

    async flush(filePath: string) {
        for (const addon of this.project.addons) {
            for (const file of await findFiles(addon.folder, addon.name)) {
                let content;
                if (!file.noCompile) {
                    content = await gCompilerManager.compile(file.path);
                }

                if (content) {
                    this.zipFile.addBuffer(Buffer.from(content, 'utf-8'), file.relative);
                } else {
                    this.zipFile.addFile(file.path, file.relative);
                }
            }
        }

        this.zipFile.end();
        await this.writeZip(this.zipFile, fs.createWriteStream(filePath));
    }
}

/**
 * @File   : addon.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:45:40 PM
 */

import * as fs from 'fs-extra';

import { ZipFile } from 'yazl';
import { findFiles } from './files';

import { Project } from './project';
import { gCompilerManager } from './compiler';

export class Addon {
    private zipFile = new ZipFile();

    constructor(private project: Project, pid: string) {
        const env = project.buildEnvs.get(pid);
        if (!env) {
            throw Error('not found env');
        }
        gCompilerManager.setEnv(env);
    }

    flush(fileName: string) {
        return new Promise((resolve, reject) => {
            return Promise.resolve(
                (async () => {
                    try {
                        for (const addon of this.project.addons) {
                            const files = await findFiles(addon.folder, addon.name);

                            for (const file of files) {
                                const content = await gCompilerManager.compile(file.file);
                                if (content) {
                                    this.zipFile.addBuffer(Buffer.from(content, 'utf-8'), file.relative);
                                } else {
                                    this.zipFile.addFile(file.file, file.relative);
                                }
                            }
                        }

                        this.zipFile.end();
                        this.zipFile.outputStream.pipe(fs.createWriteStream(fileName)).on('close', () => resolve(true));
                    } catch (error) {
                        console.error(error);
                        reject(error);
                    }
                })()
            );
        });
    }
}

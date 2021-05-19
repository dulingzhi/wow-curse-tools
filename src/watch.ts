/**
 * @File   : watch.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/17/2021, 11:01:25 AM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

import * as Watcher from 'watcher';

import { Project } from './lib/project';
import { File, findFiles } from './lib/files';
import { gCompilerManager } from './lib/compiler';
import { gEnv } from './lib/env';
import { isListFile } from './lib/util';
import { Mutex } from 'async-mutex';

export class Watch {
    private output: string;
    private files = new Map<string, File>();
    private project = new Project(true);
    private mutex = new Mutex();

    async run(output: string, buildId?: string) {
        this.output = output;

        await this.project.init();
        console.log(path.resolve(this.output, this.project.name));
        console.log(this.project.folder);

        if (path.resolve(this.output, this.project.name).toLowerCase() === this.project.folder.toLowerCase()) {
            throw Error('code folder is same as output folder');
        }

        const env = this.project.buildEnvs.get(buildId || 'none');
        if (!env) {
            throw Error('');
        }

        gEnv.setEnv(env);

        const watcher = new Watcher(this.project.folder);

        setTimeout(() => {
            watcher
                .on('add', (filePath: string) => this.onFileChanged(filePath))
                .on('change', (filePath: string) => this.onFileChanged(filePath))
                .on('unlink', (filePath: string) => this.onFileUnlink(filePath));
        }, 1000);

        this.refresh();
    }

    private async refresh() {
        try {
            const files = new Map(
                (await findFiles(this.project.folder, this.project.name)).map((file) => [file.path, file])
            );

            for (const file of files.values()) {
                if (!this.files.has(file.path)) {
                    await this.compileFile(file);
                }
            }

            for (const file of this.files.values()) {
                if (!files.has(file.path)) {
                    await this.removeFile(file);
                }
            }

            this.files = files;
        } catch (error) {
            console.error(error);
        }
    }

    private resolveFilePath(file: File) {
        return path.resolve(this.output, file.relative);
    }

    private async compileFile(file: File) {
        let content;
        if (!file.noCompile) {
            content = await gCompilerManager.compile(file.path);
        }

        const targetFile = this.resolveFilePath(file);

        await fs.mkdirp(path.dirname(targetFile));

        if (content) {
            await fs.writeFile(targetFile, content);
        } else {
            await fs.copyFile(file.path, targetFile);
        }

        console.log(`compile file: ${targetFile}`);
    }

    private async removeFile(file: File) {
        try {
            const targetPath = this.resolveFilePath(file);
            await fs.unlink(targetPath);

            console.log(`remove file: ${targetPath}`);
        } catch {}
    }

    private async onFileChanged(filePath: string) {
        const file = this.files.get(filePath);
        if (file) {
            const release = await this.mutex.acquire();
            try {
                await this.compileFile(file);

                if (isListFile(filePath)) {
                    await this.refresh();
                }
            } catch (error) {
                console.error(error);
            } finally {
                release();
            }
        }
    }

    private async onFileUnlink(filePath: string) {
        const file = this.files.get(filePath);
        if (file) {
            const release = await this.mutex.acquire();
            try {
                await this.removeFile(file);

                if (isListFile(filePath)) {
                    await this.refresh();
                }
            } catch (error) {
                console.error(error);
            } finally {
                release();
            }
        }
    }
}

/**
 * @File   : watch.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/17/2021, 11:01:25 AM
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as Watcher from 'watcher';

import { Project } from './lib/project';
import { File } from './lib/files';
import { gCompilerManager } from './lib/compiler';
import { BuildId, gEnv } from './lib/env';
import { copyFile, isListFile, writeFile } from './lib/util';
import { Mutex } from 'async-mutex';
import { proto_database } from './lib/proto/product.proto';

export class Build {
    private output: string;
    private files = new Map<string, File>();
    private project = new Project(true);
    private mutex = new Mutex();

    constructor(private watch = false) {}

    async resolveOutput(buildId: BuildId) {
        const buildData = gEnv.getBuildData(buildId);
        if (!buildData) {
            return undefined;
        }

        const buildFolder = buildData.path;
        const addonPath = 'Interface/AddOns';

        {
            const configPath = path.resolve(os.homedir(), '.wct.json');
            if (await fs.pathExists(configPath)) {
                try {
                    const cfg = await fs.readJson(configPath);
                    if (typeof cfg.buildPath === 'object') {
                        if (cfg.buildPath[BuildId[buildId]]) {
                            return path.resolve(cfg.buildPath[BuildId[buildId]], addonPath);
                        }

                        for (const k of buildData.atlas) {
                            if (cfg.buildPath[k]) {
                                return path.resolve(cfg.buildPath[k], addonPath);
                            }
                        }
                    }
                } catch {}
            }
        }

        {
            const productFilePath = (() => {
                if (os.type() === 'Windows_NT') {
                    return process.env.programdata
                        ? path.resolve(process.env.programdata, 'Battle.net/Agent/product.db')
                        : undefined;
                } else if (os.type() === 'Darwin') {
                    return '/Users/Shared/Battle.net/Agent/product.db';
                }
                return undefined;
            })();
            if (productFilePath && (await fs.pathExists(productFilePath))) {
                try {
                    const db = proto_database.Database.decode(await fs.readFile(productFilePath));
                    const install = db.productInstall.find((p) => p.productCode === buildData.product);
                    if (install && install.settings?.installPath) {
                        return path.resolve(install.settings.installPath, buildFolder, addonPath);
                    }
                } catch {}
            }
        }

        throw Error('resolve output path error');
    }

    async run(output: string | undefined, buildId: BuildId) {
        await this.project.init();

        const env = this.project.buildEnvs.get(buildId);
        if (!env) {
            throw Error('error build');
        }

        if (!output) {
            output = await this.resolveOutput(buildId);
        }

        if (output) {
            this.output = output;
        } else {
            throw Error('Unknown output path');
        }

        if (path.resolve(this.output, this.project.name).toLowerCase() === this.project.folder.toLowerCase()) {
            throw Error('code folder is same as output folder');
        }

        gEnv.setEnv(env);

        if (this.watch) {
            const watcher = new Watcher(this.project.folder, { recursive: true });

            setTimeout(() => {
                watcher
                    .on('add', (filePath: string) => this.onFileChanged(filePath))
                    .on('change', (filePath: string) => this.onFileChanged(filePath))
                    .on('unlink', (filePath: string) => this.onFileUnlink(filePath));
            }, 1000);
        }

        this.refresh();
    }

    private async refresh() {
        try {
            const files = await this.project.allFiles();
            const filesMap = new Map(files.map((file) => [file.path, file]));

            await Promise.all(files.filter((file) => !this.files.has(file.path)).map((file) => this.compileFile(file)));
            await Promise.all(
                [...this.files.values()].filter((file) => !filesMap.has(file.path)).map((file) => this.removeFile(file))
            );

            this.files = filesMap;
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

        if (content ? await writeFile(targetFile, content) : await copyFile(file.path, targetFile)) {
            console.log(`compile file: "${targetFile}"`);
        } else {
            // console.log(`ignore file: "${targetFile}"`);
        }
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

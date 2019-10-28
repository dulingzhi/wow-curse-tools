/**
 * @File   : pack.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 2:12:47 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { ZipFile } from 'yazl';
import { Addon } from './addon';
import { Project } from './project';

export class Pack {
    private project: Project;
    private zip = new ZipFile();

    constructor(project: Project) {
        this.project = project;
    }

    static async create(project: Project) {
        const obj = new Pack(project);
        await obj.flush();
        return obj;
    }

    async compileFile(file: string) {
        const ext = path.extname(file).toLowerCase();

        switch (ext) {
            case '.toc':
                return Buffer.from(this.compileToc(await fs.readFile(file, { encoding: 'utf-8' })));
            case '.lua':
                return Buffer.from(this.compileLua(await fs.readFile(file, { encoding: 'utf-8' })));
        }
        return undefined;
    }

    compileToc(content: string) {
        return content.replace(/@project-version@/g, this.project.version);
    }

    compileLua(content: string) {
        return content
            .replace(/--\s*@debug@/g, '--[===[@debug@')
            .replace(/--\s*@end-debug@/g, '--@end-debug@]===]')
            .replace(/--\[=*\[@non-debug@/g, '--@non-debug@')
            .replace(/--@end-non-debug@\]=*\]/g, '--@end-non-debug@');
    }

    async flush() {
        const addons: Addon[] = [
            new Addon(this.project.name, path.resolve('./'), [...this.project.otherAddons.values()]),
            ...[...this.project.otherAddons.entries()].map(([name, folder]) => new Addon(name, folder))
        ];

        for (const addon of addons) {
            for (const file of await addon.getFiles()) {
                const content = await this.compileFile(file);
                const relative = path.join(addon.name, path.relative(addon.folder, file));
                if (content) {
                    this.zip.addBuffer(content, relative);
                } else {
                    this.zip.addFile(file, relative);
                }
            }
        }

        this.zip.end();
    }

    pipe(stream: fs.WriteStream) {
        this.zip.outputStream.pipe(stream);
        this.flush();
    }

    run() {
        return new Promise(resolve => {
            const stream = fs
                .createWriteStream(`${this.project.name}-${this.project.version}.zip`)
                .on('close', () => resolve());
            this.pipe(stream);
        });
    }
}

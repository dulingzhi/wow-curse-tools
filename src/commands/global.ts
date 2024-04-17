/**
 * @File   : global.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/17/2024, 7:37:58 PM
 */

import path = require('path');
import fs = require('fs-extra');
import luaparse = require('luaparse');

import { Project } from '../lib/project';

export class Global {
    private project = new Project();
    private output: fs.WriteStream;

    async process(file: string) {
        const ast = luaparse.parse(await fs.readFile(file, 'utf-8'), { scope: true });
        let globals = (ast as any).globals;
        if (globals) {
            globals = globals.filter(
                (g: any) => g.name !== '_G' && g.name !== 'LibStub' && g.name !== 'Enum' /*&& !g.name.startsWith('LE_')*/
            );

            if (globals.length > 0) {
                this.output.write(`file: ${file}\n`);

                for (const g of globals) {
                    if (g.name !== '_G') {
                        this.output.write(`    ${g.name}\n`);
                    }
                }
            }
        }
    }

    async run(output: string) {
        this.output = fs.createWriteStream(output);
        await this.project.init();

        const files = (await this.project.allFiles())
            .filter((f) => !this.project.isNoCompile(f.path))
            .filter((f) => path.extname(f.path).toLowerCase() === '.lua')
            .map((f) => f.path);

        for (const file of files) {
            await this.process(file);
        }
        this.output.close();
    }
}

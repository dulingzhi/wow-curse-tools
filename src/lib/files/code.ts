/**
 * @File   : code.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:20:08 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

import { DOMParser } from 'xmldom';

export class CodeFilesFinder {
    private _files = new Set<string>();

    private parseFileName(name: string) {
        return name.replace(/\\+/g, '/');
    }

    private async parseToc(file: string) {
        const content = await fs.readFile(file, { encoding: 'utf-8' });
        const folder = path.dirname(path.resolve(file));

        for (let line of content.split(/[\r\n]+/)) {
            line = line.trim();
            if (line !== '' && !line.startsWith('#')) {
                await this.parseFile(path.resolve(folder, this.parseFileName(line)));
            }
        }
    }

    private async parseXml(file: string) {
        const folder = path.dirname(path.resolve(file));

        const parseNodes = async (nodes: any) => {
            for (let i = 0; i < nodes.length; i++) {
                const element = nodes.item(i);
                if (element) {
                    const f = element.getAttribute('file');
                    if (f) {
                        await this.parseFile(path.resolve(folder, this.parseFileName(f)));
                    }
                }
            }
        };

        const content = await fs.readFile(file, { encoding: 'utf-8' });
        const doc = new DOMParser().parseFromString(content);
        const ui = doc.getElementsByTagName('Ui');

        if (ui.length !== 1) {
            throw Error('xml error');
        }

        const root = ui[0];
        if (!root) {
            throw Error('xml error');
        }

        await parseNodes(root.getElementsByTagName('Include'));
        await parseNodes(root.getElementsByTagName('Script'));
    }

    private async parseFile(file: string) {
        if (!(await fs.pathExists(file))) {
            throw Error(`not found file ${file}`);
        }

        this._files.add(path.resolve(file));

        const ext = path.extname(file).toLowerCase();

        switch (ext) {
        case '.toc':
            await this.parseToc(file);
            break;
        case '.xml':
            await this.parseXml(file);
            break;
        case '.lua':
            break;
        default:
            throw Error('Unknown file type');
        }
    }

    async findFiles(file: string) {
        await this.parseFile(path.resolve(file));
        return this._files;
    }
}

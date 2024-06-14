/**
 * @File   : code.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:20:08 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

import { DOMParser } from '@xmldom/xmldom';
import { isNeedRemoveNode, readFile } from '../util';
import { gEnv } from '../env';
import { gRemote } from '../remote';

export class CodeFilesFinder {
    private _paths = new Set<string>();

    constructor(private fetchRemote = false) {}

    private parseFileName(name: string) {
        return name.replace(/\\+/g, '/');
    }

    private async parseToc(filePath: string) {
        const content = await readFile(filePath);
        const folder = path.dirname(path.resolve(filePath));

        for (let line of content.split(/[\r\n]+/)) {
            line = line.trim();
            if (line !== '' && !line.startsWith('#')) {
                await this.parseFile(path.resolve(folder, this.parseFileName(line)));
            }
        }
    }

    private async parseXml(filePath: string, parentRemote?: string) {
        const folder = path.dirname(path.resolve(filePath));

        const parseNodes = async (nodes: HTMLCollectionOf<Element>) => {
            for (let i = 0; i < nodes.length; i++) {
                const element = nodes.item(i);
                if (element && !isNeedRemoveNode(element)) {
                    const f = element.getAttribute('file');
                    if (f) {
                        const remote = this.fetchRemote ? element.getAttribute('remote') || parentRemote : undefined;
                        if (remote) {
                            const buf = await gRemote.getFile(
                                remote,
                                this.parseFileName(element.getAttribute('remote-file') || f)
                            );
                            if (buf) {
                                const filePath = path.resolve(folder, this.parseFileName(f));
                                console.log(`Unpack ${filePath}`);
                                await fs.mkdirp(path.dirname(filePath));
                                await fs.writeFile(path.resolve(folder, this.parseFileName(f)), buf);
                            }
                        }
                        await this.parseFile(path.resolve(folder, this.parseFileName(f)), remote);
                    }
                }
            }
        };

        const content = await readFile(filePath);
        const doc = new DOMParser().parseFromString(content);

        if (doc.getElementsByTagName('Bindings').length > 0) {
            return;
        }

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

    private async parseFile(filePath: string, remote?: string) {
        if (!(await fs.pathExists(filePath))) {
            if (gEnv.env && !gEnv.env.debug) {
                throw Error(`not found file ${filePath}`);
            } else {
                console.error(`not found file ${filePath}`);
                return;
            }
        }

        this._paths.add(path.resolve(filePath));

        const ext = path.extname(filePath).toLowerCase();

        switch (ext) {
            case '.toc':
                await this.parseToc(filePath);
                break;
            case '.xml':
                await this.parseXml(filePath, remote);
                break;
            case '.lua':
                break;
            default:
                throw Error('Unknown file type');
        }
    }

    async findFiles(filePath: string) {
        await this.parseFile(path.resolve(filePath));
        return this._paths;
    }
}

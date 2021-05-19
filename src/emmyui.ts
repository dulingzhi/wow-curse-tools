/**
 * @File   : emmyui.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/19/2021, 2:34:48 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import * as xml2js from 'xml2js';

import { File, findFiles } from './lib/files';
import { Project } from './lib/project';

const GLOBAL = new Set(['$', 'Script', 'Include', 'FontFamily', 'Font', 'Texture', 'FontString']);
const CHILD = new Set(['$']);

function genPairs(filter: Set<string>) {
    return function* (obj: object) {
        for (const [k, v] of Object.entries(obj)) {
            if (!filter.has(k)) {
                for (const item of v) {
                    yield [k as string, item];
                }
            }
        }
    };
}

const parisGlobal = genPairs(GLOBAL);
const parisChild = genPairs(CHILD);

class Frame {
    readonly name: string;
    readonly parentKey: string;
    readonly tagName: string;
    readonly inherits: string[] = [];
    readonly virtual: boolean;

    fields = new Map<string, Frame>();

    constructor(tagName: string, d: any, isLayer: boolean = false) {
        this.name = d.$?.name || undefined;
        this.parentKey = d.$?.parentKey || undefined;
        this.virtual = d.$?.virtual === 'true';

        if (!isLayer) {
            const inherits: string | undefined = d.$?.inherits;

            if (inherits) {
                this.inherits.push(
                    ...inherits
                        .split(/[ ,]/g)
                        .map((x) => x.trim())
                        .filter((x) => x !== '')
                );
            } else if (this.name !== tagName) {
                this.inherits.push(tagName);
            }

            if (d.$?.mixin) {
                this.inherits.push(d.$?.mixin);
            }
        } else {
            this.inherits.push(tagName);
        }

        if (d.Layers?.[0]?.Layer) {
            for (const layer of d.Layers?.[0]?.Layer) {
                for (const [k, v] of parisChild(layer)) {
                    const child = new Frame(k, v, true);

                    if (child.parentKey) {
                        this.fields.set(child.parentKey, child);
                    }
                }
            }
        }

        if (d.Frames?.[0]) {
            for (const [k, v] of parisChild(d.Frames?.[0])) {
                const child = new Frame(k, v);

                if (child.parentKey) {
                    this.fields.set(child.parentKey, child);
                }
            }
        }
    }
}

export class EmmyUI {
    outChild(frame: Frame, depth: number, out: string[]) {
        const space = ' '.repeat(depth * 4);
        for (const [k, field] of frame.fields.entries()) {
            out.push(`${space}---@type ${field.inherits.join('|')}`);

            if (field.fields.size > 0) {
                out.push(`${space}${k} = {`);
                this.outChild(field, depth + 1, out);
                out.push(`${space}},`);
            } else {
                out.push(`${space}${k} = {},`);
            }
        }
    }

    processFrame(k: string, v: any, out: string[]) {
        const frame = new Frame(k, v);

        if (frame.name) {
            if (frame.inherits.length > 0) {
                out.push(`---@class ${frame.name}: ${frame.inherits.join(',')}`);
            } else {
                out.push(`---@class ${frame.name}`);
            }

            if (frame.fields.size > 0) {
                out.push(`${frame.virtual ? 'local ' : ''}${frame.name} = {`);
                this.outChild(frame, 1, out);
                out.push('}');
            } else {
                out.push(`${frame.virtual ? 'local ' : ''}${frame.name} = {}`);
            }
            out.push('');
        }
    }

    processFrames(obj: object, out: string[]) {
        for (const [k, v] of parisGlobal(obj)) {
            if (k === 'ScopedModifier') {
                this.processFrames(v, out);
            } else {
                this.processFrame(k, v, out);
            }
        }
    }

    async processFile(file: File) {
        const parser = new xml2js.Parser();
        const d = await parser.parseStringPromise(await fs.readFile(file.path, { encoding: 'utf-8' }));

        const ui = d.Ui;
        if (!ui) {
            return;
        }

        const out: string[] = [];

        this.processFrames(ui, out);

        if (out.length > 0) {
            const filePath = path.resolve('.ui', file.relative) + '.lua';

            await fs.mkdirp(path.dirname(filePath));
            await fs.writeFile(filePath, out.join('\n'));
        }
    }

    async run(filePath?: string) {
        let files: File[];
        if (!filePath) {
            const project = new Project(true);
            await project.init();
            files = await project.findFiles();
        } else {
            if (path.extname(filePath).toLowerCase() !== '.toc') {
                throw Error('need toc file');
            }
            const folder = path.dirname(filePath);
            const name = path.basename(filePath, '.toc');
            files = await findFiles(folder, name);
        }

        for (const file of files) {
            if (
                path.extname(file.path).toLowerCase() === '.xml' &&
                path.basename(file.path).toLowerCase() !== 'bindings.xml'
            ) {
                await this.processFile(file);
            }
        }
    }
}

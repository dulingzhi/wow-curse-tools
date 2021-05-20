/**
 * @File   : emmyui.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/19/2021, 2:34:48 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import * as luaparse from 'luaparse';

import { DOMParser } from 'xmldom';

import { File, findFiles } from './lib/files';
import { Project } from './lib/project';
import { readFile } from './lib/util';

const GLOBAL_INGORES = new Set(['Font', 'FontString', 'FontFamily', 'Texture', 'Script', 'Include']);

function* pairs(element: Element) {
    if (!element.childNodes) {
        return;
    }
    for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i];
        if (node.nodeType === 1) {
            yield node as Element;
        }
    }
}

class ElementFinder {
    constructor(readonly element: Element) {}

    tags(tagName: string) {
        return [...pairs(this.element)].filter((e) => e.tagName === tagName).map((e) => new ElementFinder(e));
    }

    get children() {
        return [...pairs(this.element)].map((e) => new ElementFinder(e));
    }
}

class Frame {
    readonly name?: string;
    readonly parentKey?: string;
    readonly virtual: boolean;

    readonly inherits: string[] = [];
    readonly fields: Frame[] = [];

    constructor(e: Element, readonly parent?: Frame, isLayer = false) {
        this.name = e.getAttribute('name') || undefined;
        this.parentKey = e.getAttribute('parentKey') || undefined;
        this.virtual = e.getAttribute('virtual') === 'true';

        if (this.name?.startsWith('$parent') && this.parent?.name) {
            this.name = this.name.replace(/^\$parent/g, this.parent.name);
        } else if (this.name?.startsWith('$')) {
            this.name = undefined;
        }

        if (!isLayer) {
            this.inherits.push(
                ...['inherits', 'mixin']
                    .map(
                        (k) =>
                            e
                                .getAttribute(k)
                                ?.split(/ ,/g)
                                .map((x) => x.trim())
                                .filter((x) => x !== '') ?? []
                    )
                    .flat()
            );

            if (this.inherits.length === 0) {
                this.inherits.push(e.tagName);
            }
        } else {
            this.inherits.push(e.tagName);
        }

        const elementFinder = new ElementFinder(e);

        this.fields.push(
            ...(elementFinder
                .tags('Layers')[0]
                ?.tags('Layer')
                .map((f) =>
                    f.children
                        .filter((f) => f.element.getAttribute('parentKey'))
                        .map((f) => new Frame(f.element, this, true))
                )
                .flat() ?? [])
        );

        this.fields.push(
            ...(elementFinder
                .tags('Frames')[0]
                ?.children.filter((f) => f.element.getAttribute('parentKey'))
                .map((f) => new Frame(f.element, this)) ?? [])
        );
    }

    isClass() {
        return this.virtual;
    }

    isContainer() {
        return this.fields.length > 0;
    }

    isGlobal() {
        return this.name && !this.isClass() && !this.isInVirtual();
    }

    isInVirtual(): boolean {
        return this.virtual || !!this.parent?.isInVirtual();
    }

    resolveClassName() {
        return this.isClass() || this.isContainer() ? this.className : this.inherits.join(' , ');
    }

    get className() {
        return (
            this.name ??
            (() => {
                const r = [];
                let parent: Frame | undefined = this;
                while (parent) {
                    r.push(parent.parentKey || parent.name);

                    parent = parent.parent;
                }
                r.push('_');
                return r.reverse().join('_');
            })()
        );
    }
}

export class EmmyUI {
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
            const ext = path.extname(file.path).toLowerCase();
            if (ext === '.xml') {
                try {
                    await this.processFile(file);
                } catch (error) {
                    console.error(error);
                }
            } else if (ext === '.lua') {
                this.processLuaFile(file);
            }
        }
    }

    processFrame(frame: Frame, out: string[]) {
        for (const field of frame.fields) {
            this.processFrame(field, out);
        }

        if (frame.isClass() || frame.isContainer()) {
            if (frame.inherits.length > 0) {
                out.push(`---@class ${frame.className} : ${frame.inherits.join(' , ')}`);
            } else {
                out.push(`---@class ${frame.className}`);
            }

            for (const field of frame.fields) {
                out.push(`---@field ${field.parentKey} ${field.resolveClassName()}`);
            }
        } else if (frame.isGlobal()) {
            out.push(`---@type ${frame.inherits.join(' | ')}`);
        }

        if (frame.isGlobal()) {
            out.push(`${frame.className} = {}`);
        } else if (frame.isClass() || frame.isContainer()) {
            out.push(`local ${frame.className} = {}`);
        }

        if (out.length > 0 && out[out.length - 1] !== '') {
            out.push('');
        }
    }

    processDocument(element: Element, out: string[]) {
        for (const e of pairs(element)) {
            if (e.tagName === 'ScopedModifier') {
                this.processDocument(e, out);
            } else if (!GLOBAL_INGORES.has(e.tagName)) {
                this.processFrame(new Frame(e), out);
            }
        }
    }

    async processFile(file: File) {
        const doc = new DOMParser().parseFromString(await readFile(file.path));
        const ui = doc.getElementsByTagName('Ui')?.[0];

        if (!ui) {
            throw Error('ui');
        }
        const out: string[] = [];
        this.processDocument(ui, out);

        if (out.length > 0) {
            const filePath = path.resolve('.ui', file.relative + '.lua');

            await fs.mkdirp(path.dirname(filePath));
            await fs.writeFile(filePath, out.join('\n'));
        }
    }

    async processLuaFile(file: File) {
        try {
            const code = (await readFile(file.path)).replace(/break;/g, 'break');
            const ast = luaparse.parse(code, { luaVersion: '5.1' });

            for (const node of ast.body) {
                if (node.type === 'AssignmentStatement') {
                    // console.log(node.variables.length);
                    console.log(node.variables[0].type);
                }
            }
        } catch (error) {
            console.error(`${file.path} ${error}`);
        }
    }
}

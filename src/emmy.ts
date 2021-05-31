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

    tag(tagName: string) {
        const tags = this.tags(tagName);
        return tags.length > 0 ? tags[0] : undefined;
    }
}

interface Field {
    parent?: Field;
    parentKey?: string;
    inherits: string[];
}

class BaseType implements Field {
    parentKey: string;
    inherits: string[] = [];

    constructor(e: Element, readonly parent?: UiObject) {
        const type = e.getAttribute('type') as string;
        this.parentKey = e.getAttribute('key') as string;
        this.inherits.push(type === 'global' ? 'table' : type);
    }
}

class UiObject implements Field {
    readonly name?: string;
    readonly parentKey?: string;
    readonly virtual: boolean;

    readonly inherits: string[] = [];
    readonly fields: UiObject[] = [];
    readonly keyValues: BaseType[] = [];

    constructor(e: Element, readonly parent?: UiObject, isLayer = false) {
        this.name = e.getAttribute('name')?.replace(/[^\w]/g, '_') || undefined;
        this.parentKey = e.getAttribute('parentKey') || undefined;
        this.virtual = e.getAttribute('virtual') === 'true' || e.getAttribute('intrinsic') === 'true';

        if (this.name?.startsWith('$parent') && this.parent?.name) {
            this.name = this.name.replace(/^\$parent/g, this.parent.name);
        } else if (this.name?.startsWith('$')) {
            this.name = undefined;
        }

        if (!isLayer) {
            this.inherits.push(
                ...['inherits', 'mixin', 'secureMixin']
                    .map(
                        (k) =>
                            e
                                .getAttribute(k)
                                ?.split(/ |,/)
                                .map((x) => x.trim().replace(/[^\w]/g, '_'))
                                .filter((x) => x !== '') ?? []
                    )
                    .flat()
            );

            if (!e.getAttribute('inherits')) {
                this.inherits.push(e.tagName);
            }

            if (this.inherits.length === 0) {
                this.inherits.push(e.tagName);
            }
        } else {
            this.inherits.push(e.tagName);
        }

        const elementFinder = new ElementFinder(e);

        this.fields.push(
            ...(elementFinder
                .tag('Layers')
                ?.tags('Layer')
                .map((f) =>
                    f.children
                        .filter((f) => f.element.getAttribute('parentKey'))
                        .map((f) => new UiObject(f.element, this, true))
                )
                .flat() ?? [])
        );

        this.fields.push(
            ...(elementFinder
                .tag('Frames')
                ?.children.filter((f) => f.element.getAttribute('parentKey'))
                .map((f) => new UiObject(f.element, this)) ?? [])
        );

        this.keyValues.push(
            ...(elementFinder.tag('KeyValues')?.children.map((x) => new BaseType(x.element, this)) ?? [])
        );
    }

    isClass() {
        return this.virtual;
    }

    isContainer() {
        return this.fields.length > 0 || this.keyValues.length > 0;
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
                let parent: UiObject | undefined = this;
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

export class Emmy {
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
            try {
                if (ext === '.xml') {
                    await this.processXmlFile(file);
                } else if (ext === '.lua') {
                    await this.processLuaFile(file);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    processFrame(frame: UiObject, out: string[]) {
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
            for (const kv of frame.keyValues) {
                out.push(`---@field ${kv.parentKey} ${kv.inherits.join()}`);
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
                this.processFrame(new UiObject(e), out);
            }
        }
    }

    async processXmlFile(file: File) {
        const doc = new DOMParser().parseFromString(await readFile(file.path));
        const ui = doc.getElementsByTagName('Ui')?.[0];

        if (!ui) {
            throw Error('ui');
        }
        const out: string[] = [];
        this.processDocument(ui, out);

        if (out.length > 0) {
            const filePath = path.resolve('.emmy/ui', path.basename(file.relative, '.xml') + '.lua');

            await this.writeFile(filePath, out);
        }
    }

    processBody(body: luaparse.Statement[], out: string[]) {
        for (const node of body) {
            if (node.type === 'AssignmentStatement') {
                // todo:
            } else if (node.type === 'FunctionDeclaration') {
                if (!node.isLocal && node.identifier) {
                    const identifier = node.identifier;

                    if (identifier.type === 'Identifier') {
                        const name = identifier.name;
                        const args = node.parameters.map((x) => (x.type === 'Identifier' ? x.name : '...')).join(', ');
                        out.push(`function ${name}(${args}) end`);
                    } else if (identifier.type === 'MemberExpression') {
                        if (identifier.base.type !== 'Identifier' || identifier.identifier.type !== 'Identifier') {
                            throw Error('');
                        }

                        console.log(identifier.base.name);

                        const name = `${identifier.base.name}${identifier.indexer}${identifier.identifier.name}`;
                        const args = node.parameters.map((x) => (x.type === 'Identifier' ? x.name : '...')).join(', ');
                        out.push(`function ${name}(${args}) end`);
                    }
                }
            } else if (node.type === 'DoStatement') {
                this.processBody(node.body, out);
            }
        }
    }

    async processLuaFile(file: File) {
        try {
            const code = (await readFile(file.path)).replace(/break;/g, 'break');
            const ast = luaparse.parse(code, { luaVersion: '5.1', scope: true, locations: true, ranges: true });

            const out: string[] = [];

            this.processBody(ast.body, out);

            if (out.length > 0) {
                const filePath = path.resolve('.emmy/lua', file.relative);

                await this.writeFile(filePath, out);
            }
        } catch (error) {
            console.error(`${file.path} ${error}`);
        }
    }

    async writeFile(filePath: string, out: string[]) {
        await fs.mkdirp(path.dirname(filePath));
        await fs.writeFile(filePath, out.join('\n'));
    }
}

/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/28/2024, 11:39:26 AM
 */

import * as fs from 'fs-extra';
import * as luaparse from 'luaparse';
import { findFiles } from './lib/files';
import { Project } from './lib/project';
import { gEnv } from './lib/env';
import { Curse } from './lib/curse';
import { readLocale } from './lib/locale';

class Scaner {
    readonly locales = new Set<string>();
    scanArray(ns: any[]) {
        for (const n of ns) {
            this.scanNode(n);
        }
    }

    scanNode(n: any) {
        if (n.body) {
            this.scanArray(n.body as any);
        }
        if (n.init) {
            this.scanArray(n.init as any);
        }
        if (n.expression) {
            this.scanNode(n.expression as any);
        }
        if (n.arguments) {
            this.scanArray(n.arguments as any);
        }
        if (n.left) {
            this.scanNode(n.left as any);
        }
        if (n.right) {
            this.scanNode(n.right as any);
        }
        if (n.base) {
            this.scanNode(n.base as any);
        }
        if (n.variables) {
            this.scanArray(n.variables as any);
        }
        if (n.fields) {
            this.scanArray(n.fields as any);
        }
        if (n.arguments) {
            this.scanArray(n.arguments as any);
        }
        if (n.key) {
            this.scanNode(n.key as any);
        }
        if (n.value) {
            this.scanNode(n.value as any);
        }
        if (n.clauses) {
            this.scanArray(n.clauses as any);
        }

        if (n.type === 'MemberExpression') {
            if (n.base?.name === 'L') {
                this.locales.add(n.identifier.name);
            }

            if (n.identifier?.name === 'L') {
                this.locales.add(n.index.raw);
            }
        }

        if (n.type === 'IndexExpression') {
            if (n.base?.name === 'L') {
                this.locales.add(n.index.raw);
            }
        }
    }
}

export class Locale {
    private project = new Project();
    constructor(private token: string) {}

    async init() {
        await this.project.init();

        const env = this.project.buildEnvs.values().next().value;
        if (!env) {
            return;
        }
        gEnv.setEnv(env);
    }

    async export() {
        await this.init();

        const cli = new Curse(this.project.curseId, this.token);

        const files = (
            await Promise.all(this.project.addons.map((addon) => findFiles(addon.folder, addon.name)))
        ).flat();

        for (const file of files) {
            if (file.path.endsWith('.lua')) {
                let body = await fs.readFile(file.path, 'utf-8');

                if (body) {
                    const replaces = [];

                    for (const m of body.matchAll(/--\s*@locale:(.+)@([.\s]*)--\s*@end-locale@/g)) {
                        const args = Object.fromEntries(
                            m[1].split(';').map((n) => n.trim().split('=') as [string, string])
                        );

                        const locale = await cli.exportLocale(args.language, args.type || undefined);
                        const eol = body.indexOf('\r\n') > 0 ? '\r\n' : '\n';

                        replaces.push({
                            index: m.index || 0,
                            source: m[0],
                            target: m[0].replace(m[2], eol + locale + eol),
                        });
                    }

                    if (replaces.length > 0) {
                        replaces.sort((a, b) => b.index - a.index);

                        for (const n of replaces) {
                            body = body.replace(n.source, n.target);
                        }

                        fs.writeFile(file.path, body);
                    }
                }
            }
        }
    }

    async import() {
        await this.init();

        const cli = new Curse(this.project.curseId, this.token);

        for (const l of this.project.localizations) {
            const locale = await readLocale(l.path);

            if (locale) {
                await cli.importLocale(l.lang, locale);
            }
        }
    }

    async scan() {
        await this.init();

        const files = (
            await Promise.all(this.project.addons.map((addon) => findFiles(addon.folder, addon.name)))
        ).flat();

        const scaner = new Scaner();
        for (const file of files) {
            if (file.path.endsWith('.lua') && !file.path.includes('Localization') && !file.path.includes('Libs')) {
                const body = await fs.readFile(file.path, 'utf-8');

                const ast = luaparse.parse(body);

                scaner.scanArray(ast.body);
            }
        }
        // console.log(scaner.locales);

        for (const a of scaner.locales) {
            console.log(a);
        }
    }
}

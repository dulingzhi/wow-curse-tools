/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/28/2024, 11:39:26 AM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import * as luaparse from 'luaparse';
import { Project } from './lib/project';
import { gEnv } from './lib/env';
import { Curse } from './lib/curse';
import { readLocale } from './lib/locale';

function isInFolder(p: string, f: string) {
    return !path.relative(f, p).startsWith('..');
}

class LocaleItem {
    readonly s: string;

    constructor(readonly raw: string) {
        this.s = this.resolve(raw);
    }

    resolve(s: string) {
        const m = /^['"](.+)['"]$/gs.exec(s);
        if (m) {
            s = m[1];
            s = s.replace(/\\'/g, "'");
            s = s.replace(/\\"/g, '"');
        }
        return s;
    }
}

class Scaner {
    readonly locales = new Map<string, LocaleItem>();

    constructor(files: string[]) {
        this.apply(files);
    }

    addLocale(s: string) {
        if (!s) {
            return;
        }
        const l = new LocaleItem(s);
        this.locales.set(l.s, l);
    }

    scanArray(ns: any[]) {
        if (typeof ns !== 'object') {
            console.log(ns);
        }
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
            if (n.arguments.type) {
                this.scanNode(n.arguments as any);
            } else {
                this.scanArray(n.arguments as any);
            }
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
                this.addLocale(n.identifier?.name);
            }

            if (n.identifier?.name === 'L') {
                this.addLocale(n.index?.raw);
            }
        }

        if (n.type === 'IndexExpression') {
            if (n.base?.name === 'L') {
                this.addLocale(n.index?.raw);
            }

            if (n.identifier?.name === 'L') {
                this.addLocale(n.index?.raw);
            }

            if (n.base?.identifier?.name === 'L') {
                this.addLocale(n.index?.raw);
            }
        }
    }

    apply(files: string[]) {
        for (const file of files) {
            const body = fs.readFileSync(file, 'utf-8');
            const ast = luaparse.parse(body);
            this.scanArray(ast.body);
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

        const files = await this.project.allFiles();

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

        for (const f of this.project.localizations) {
            const locale = await readLocale(f.path);
            if (locale) {
                await cli.importLocale(f.lang, locale);
            }
        }
    }

    async scan() {
        await this.init();

        const isIgnore = (p: string) => {
            for (const folder of this.project.localeIgnores) {
                if (isInFolder(p, folder)) {
                    return false;
                }
            }
            return true;
        };

        const files = (await this.project.allFiles())
            .filter((f) => f.path.endsWith('.lua'))
            .filter((f) => isIgnore(f.path))
            .map((f) => f.path);

        const codeScaner = new Scaner(files);

        for (const l of this.project.localizations) {
            const oldScaner = new Scaner([l.path]);
            const oldBody = await fs.readFile(l.path, 'utf-8');
            const eol = oldBody.indexOf('\r\n') > 0 ? '\r\n' : '\n';
            let body = oldBody;

            {
                // new locales
                const newLocales = [...codeScaner.locales.values()].filter((n) => !oldScaner.locales.has(n.s));
                const newBoby = newLocales
                    .map((l) => l.s.replace("'", "\\'"))
                    .map((s) => `L['${s}'] = true`)
                    .join(eol);

                if (newBoby.length > 0) {
                    body = body.replace(/--\s*@locale-fill@/g, (s) => [newBoby, s].join(eol));
                }
            }

            {
                // lost locales
                const lostLocales = [...oldScaner.locales.values()].filter((n) => !codeScaner.locales.has(n.s));

                for (const l of lostLocales) {
                    const index = body.indexOf(l.raw);
                    if (index >= 0) {
                        let lineStart = body.lastIndexOf('\n', index);
                        if (lineStart >= 0) {
                            lineStart++;
                            body = body.slice(0, lineStart) + '-- [comment by wct] ' + body.slice(lineStart);
                        }
                    }
                }
            }

            if (body !== oldBody) {
                await fs.writeFile(l.path, body);
            }
        }
    }
}

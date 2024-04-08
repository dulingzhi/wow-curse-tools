/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/28/2024, 11:39:26 AM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Project } from './lib/project';
import { gEnv } from './lib/env';
import { Curse } from './lib/curse';
import { readLocale } from './lib/locale';
import { LuaFactory, LuaType } from 'wasmoon';

function isInFolder(p: string, f: string) {
    return !path.relative(f, p).startsWith('..');
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

        const args = {
            action: 'scan',
            files,
            oldFiles: this.project.localizations.map((l) => l.path),
        };

        const factory = new LuaFactory();

        await factory.mountFile('locale.lua', (await import('./lua/locale.lua')).default);
        await factory.mountFile('llex.lua', (await import('./lua/llex.lua')).default);

        const lua = await factory.createEngine();

        const A = lua.global.lua;
        const L = lua.global.address;
        const G = lua.global;

        const apis = {
            io: {
                writeFile: (p: string, d: string) => fs.writeFileSync(p, d, 'utf-8'),
                readFile: (p: string) => fs.readFileSync(p, 'utf-8'),
            },
        };

        for (const [tn, v] of Object.entries(apis)) {
            if (A.lua_getglobal(L, tn) !== LuaType.Table) {
                A.lua_pop(L, 1);
                A.lua_createtable(L, 0, Object.keys(v).length);
                A.lua_setglobal(L, tn);
                A.lua_getglobal(L, tn);
            }
            for (const [k, f] of Object.entries(v)) {
                G.pushValue(k);
                G.pushValue(f);
                A.lua_settable(L, -3);
            }
            A.lua_pop(L, 1);
        }

        await lua.doFile('./locale.lua');

        G.call('locale', args);
    }
}

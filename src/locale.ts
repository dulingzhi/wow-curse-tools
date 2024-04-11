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
    private inited = false;

    constructor(private token: string) {}

    async init() {
        if (this.inited) {
            return;
        }
        await this.project.init();

        const env = this.project.buildEnvs.values().next().value;
        if (!env) {
            return;
        }
        gEnv.setEnv(env);
        this.inited = true;
    }

    async export() {
        await this.init();

        const cli = new Curse(this.project.curseId, this.token);
        const files = await this.project.allFiles();

        for (const file of files) {
            if (file.path.endsWith('.lua')) {
                let body = await fs.readFile(file.path, 'utf-8');

                body = body.replace(/[\r\n]+/g, '\n');

                const sb = [];

                const lines = body.split(/[\r\n]+/);
                let currentOpts: Map<string, string> | undefined;

                for (const line of lines) {
                    const m = line.trim().match(/^--\s*@locale:(?<opts>.+)@$/);
                    if (m) {
                        const opts = new Map(m.groups?.opts.split(';').map((x) => x.split('=', 2) as [string, string]));
                        if (opts.get('language')) {
                            currentOpts = opts;
                        }

                        sb.push(line);
                    }

                    if (currentOpts) {
                        const m = line.trim().match(/^--\s*@end-locale@$/);
                        if (m) {
                            sb.push(
                                (
                                    await cli.exportLocale(
                                        currentOpts.get('language')!,
                                        currentOpts.get('type') || undefined
                                    )
                                ).trim()
                            );
                            currentOpts = undefined;
                            sb.push(line);
                        }
                    } else {
                        sb.push(line);
                    }
                }

                const newBody = sb.join('\n');

                if (newBody !== body) {
                    await fs.writeFile(file.path, newBody);
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

        const factory = new LuaFactory(
            (() => {
                const p = path.join(__dirname, 'glue.wasm');
                return fs.existsSync(p) ? p : undefined;
            })()
        );

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

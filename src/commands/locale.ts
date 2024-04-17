/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/28/2024, 11:39:26 AM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Project } from '../lib/project';
import { gEnv } from '../lib/env';
import { Curse } from '../lib/curse';
import { readLocale } from '../lib/locale';
import { LuaFactory, LuaType } from 'wasmoon';
import { glob } from 'fast-glob';

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
                const body = await fs.readFile(file.path, 'utf-8');
                const eol = body.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
                const sb = [];

                const lines = body.split(/\r?\n/);
                let currentOpts: Map<string, string> | undefined;
                let anyChanges = false;

                for (const line of lines) {
                    const m = line.trim().match(/^--\s*@locale:(?<opts>.+)@$/);
                    if (m) {
                        const opts = new Map(m.groups?.opts.split(';').map((x) => x.split('=', 2) as [string, string]));
                        if (opts.get('language')) {
                            currentOpts = opts;
                            anyChanges = true;
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

                const newBody = sb.join(eol);

                if (anyChanges && newBody !== body) {
                    await fs.writeFile(file.path, newBody);
                }
            }
        }
    }

    async import() {
        await this.init();

        const cli = new Curse(this.project.curseId, this.token);

        for (const file of await this.project.allFiles()) {
            if (file.path.endsWith('.lua')) {
                const r = await readLocale(file.path);
                if (r) {
                    await cli.importLocale(r.args.language, r.body);
                }
            }
        }
    }

    async scan() {
        await this.init();

        const ignores = new Set(
            this.project.localeIgnores
                .map((x) => glob.sync(x))
                .flat()
                .map((x) => path.resolve(x))
        );

        const allFiles = await this.project.allFiles();
        const files = allFiles
            .filter((f) => f.path.endsWith('.lua'))
            .filter((f) => !ignores.has(f.path))
            .map((f) => f.path);

        const oldFiles = (await Promise.all(allFiles.map(async (f) => ({ f, info: await readLocale(f.path) }))))
            .filter(({ info }) => info)
            .map(({ f }) => f.path);

        const args = {
            action: 'scan',
            files,
            oldFiles,
        };

        const factory = new LuaFactory(
            (() => {
                const p = path.join(__dirname, 'glue.wasm');
                return fs.existsSync(p) ? p : undefined;
            })()
        );

        await factory.mountFile('locale.lua', (await import('../lua/locale.lua')).default);
        await factory.mountFile('llex.lua', (await import('../lua/llex.lua')).default);

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

/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/28/2024, 11:39:26 AM
 */

import * as fs from 'fs-extra';
import { findFiles } from './lib/files';
import { Project } from './lib/project';
import { gEnv } from './lib/env';
import { Curse } from './lib/curse';

export class Locale {
    private project = new Project();
    constructor(private token: string) {}

    async export() {
        await this.project.init();

        const env = this.project.buildEnvs.values().next().value;
        if (!env) {
            return;
        }
        gEnv.setEnv(env);

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
}

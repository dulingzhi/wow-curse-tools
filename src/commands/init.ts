/**
 * @File   : init.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:35:35 AM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

import inquirer from 'inquirer';

import { BuildId, gEnv } from '../lib/env';
import { toInterfaceVersion } from '../lib/util';

export class Init {
    constructor() {}

    async run() {
        if (!(await fs.pathExists('package.json'))) {
            console.log('package.json not found');
            return;
        }

        const versionsMap = new Map<BuildId, string>();

        try {
            const resp = await fetch('https://wago.tools/api/builds');
            const data = await resp.json();

            for (const [buildId, buildData] of gEnv.buildData.entries()) {
                const builds: any[] = data[buildData.product];
                let build: any;
                if (buildData.version_prefix) {
                    build = builds.find((x) => x.version.startsWith(buildData.version_prefix));
                } else {
                    build = builds[0];
                }
                if (!build) {
                    continue;
                }
                versionsMap.set(buildId, build.version);
            }
        } catch {}

        const pkg = await fs.readJson('package.json');
        pkg.wow = pkg.wow || {};

        const opts = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Addon Name:',
                default: pkg.wow.name || path.basename(path.resolve('./')),
            },
            { type: 'number', name: 'curse_id', message: 'Curse Project ID:', default: pkg.wow.curse_id || 0 },
            {
                type: 'checkbox',
                name: 'builds',
                message: 'Which wow version to use?',
                choices: [...gEnv.buildData.entries()].map(([buildId, d]) => ({
                    name: `${BuildId[buildId]} (${versionsMap.get(buildId) || d.product})`,
                    value: {
                        buildKey: BuildId[buildId],
                        product: d.product,
                        version: toInterfaceVersion(versionsMap.get(buildId) || ''),
                    },
                })),
            },
        ]);

        const wow = pkg.wow;

        wow.name = opts.name;
        wow.curse_id = opts.curse_id;
        wow.builds = Object.fromEntries(opts.builds.map((x: any) => [x.buildKey, x.version]));

        await fs.writeJson('package.json', pkg, {
            spaces: 2,
            encoding: 'utf-8',
        });
    }
}

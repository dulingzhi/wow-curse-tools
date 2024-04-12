/**
 * @File   : init.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:35:35 AM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { decode as htmldecode } from 'html-entities';

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

        const versionsMap: Map<string, string> = await (async () => {
            try {
                const resp = await fetch('https://wago.tools');
                const data = await resp.text();
                const m = data.match(/data-page="([^"]+)"/);

                if (m) {
                    const d = JSON.parse(htmldecode(m[1]));
                    return new Map(d.props.versions.map((x: any) => [x.product, x.version]));
                }
            } catch {}
            return new Map();
        })();

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
                    name: `${BuildId[buildId]} (${versionsMap.get(d.product) || d.product})`,
                    value: {
                        buildKey: BuildId[buildId],
                        product: d.product,
                        version: toInterfaceVersion(versionsMap.get(d.product) || ''),
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

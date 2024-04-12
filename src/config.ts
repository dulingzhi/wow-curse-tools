/**
 * @File   : config.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/4/2021, 12:22:39 AM
 */

import * as os from 'os';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import { BuildId, gEnv } from './lib/env';
import path = require('path');
import { proto_database } from './lib/proto/product.proto';

enum WhichConfig {
    None,
    BuildPath,
}

export class Config {
    async run() {
        const opts = await inquirer.prompt([
            {
                type: 'list',
                name: 'which',
                message: 'Which config to set?',
                choices: [
                    { type: 'choice', value: WhichConfig.BuildPath, name: 'Set watch path for build id' },
                    { type: 'separator' },
                    { type: 'choice', value: WhichConfig.None, name: 'Quit' },
                ],
            },
        ]);

        switch (opts.which as WhichConfig) {
            case WhichConfig.BuildPath:
                await this.buildPath();
                break;
            default:
                break;
        }
    }

    async getDefaultPath(buildId: BuildId) {
        const buildData = gEnv.getBuildData(buildId);
        if (!buildData) {
            return;
        }

        const productFilePath = (() => {
            if (os.type() === 'Windows_NT') {
                return process.env.programdata
                    ? path.resolve(process.env.programdata, 'Battle.net/Agent/product.db')
                    : undefined;
            } else if (os.type() === 'Darwin') {
                return '/Users/Shared/Battle.net/Agent/product.db';
            }
            return undefined;
        })();
        if (productFilePath && (await fs.pathExists(productFilePath))) {
            try {
                const db = proto_database.Database.decode(await fs.readFile(productFilePath));
                const install = db.productInstall.find((p) => p.productCode === buildData.product);
                if (install && install.settings?.installPath) {
                    return path.resolve(install.settings.installPath, buildData.path);
                }
            } catch {}
        }
        return undefined;
    }

    async buildPath() {
        const allDefaults = await Promise.all(
            [...gEnv.buildData.entries()].map(async ([buildId]) => ({
                buildId,
                path: await this.getDefaultPath(buildId),
            }))
        );

        const opts = await inquirer.prompt([
            {
                type: 'list',
                name: 'first',
                choices: [
                    ...allDefaults.map((x) => ({ name: `${BuildId[x.buildId]}: (${x.path})`, value: x })),
                    'All set them',
                ],
            },
        ]);

        const setAll = opts.first == 'All set them';

        if (!setAll) {
            opts.path = (
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'path',
                        default: opts.first.path,
                    },
                ])
            ).path as string;
        }

        const cfgPath = `${os.homedir()}/.wct.json`;
        let cfg;
        try {
            cfg = await fs.readJson(cfgPath, { throws: false });
        } catch {}

        if (!cfg) {
            cfg = {};
        }

        cfg.buildPath = cfg.buildPath || {};

        if (setAll) {
            for (const v of allDefaults) {
                console.log(BuildId[v.buildId], v.path);
                cfg.buildPath[BuildId[v.buildId]] = v.path;
            }
        } else {
            cfg.buildPath[BuildId[opts.first.buildId]] = opts.path;
        }

        await fs.writeJson(cfgPath, cfg);
    }
}

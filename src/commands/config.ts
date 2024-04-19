/**
 * @File   : config.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/4/2021, 12:22:39 AM
 */

import * as os from 'os';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import { BuildId, gEnv } from '../lib/env';
import path = require('path');
import { proto_database } from '../lib/proto/product.proto';

enum WhichConfig {
    None,
    BuildPath,
    CurseWowToken,
    CurseForgeToken,
    GithubToken,
}

export class Config {
    private cfgPath = `${os.homedir()}/.wct.json`;
    async run() {
        const opts = await inquirer.prompt([
            {
                type: 'list',
                name: 'which',
                message: 'Which config to set?',
                choices: [
                    { type: 'choice', value: WhichConfig.BuildPath, name: 'Set wow path' },
                    { type: 'choice', value: WhichConfig.CurseWowToken, name: 'Set curse wow token' },
                    { type: 'choice', value: WhichConfig.CurseForgeToken, name: 'Set curseforge token' },
                    { type: 'choice', value: WhichConfig.GithubToken, name: 'Set github token' },
                    { type: 'separator' },
                    { type: 'choice', value: WhichConfig.None, name: 'Quit' },
                ],
            },
        ]);

        switch (opts.which as WhichConfig) {
            case WhichConfig.BuildPath:
                await this.buildPath();
                break;
            case WhichConfig.CurseForgeToken:
            case WhichConfig.CurseWowToken:
            case WhichConfig.GithubToken:
                await this.setToken(opts.which);
                break;
            case WhichConfig.None:
                return;
            default:
                break;
        }

        const quitOpt = await inquirer.prompt({
            type: 'list',
            name: 'quit',
            message: 'Back to main?',
            choices: [
                { type: 'choice', value: 'Quit', name: 'Quit' },
                { type: 'choice', value: 'Back', name: 'Back to main' },
            ],
        });

        if (quitOpt.quit === 'Quit') {
            return;
        }

        setTimeout(() => {
            this.run();
        }, 0);
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
                name: 'buildId',
                message: 'Which build to set?',
                choices: [
                    ...allDefaults.map((x) => ({ name: `${BuildId[x.buildId]}: (${x.path})`, value: x })),
                    'All set them',
                ],
            },
        ]);

        const setAll = opts.buildId == 'All set them';

        if (!setAll) {
            opts.path = (
                await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'path',
                        default: opts.buildId.path,
                    },
                ])
            ).path as string;
        }

        const cfgPath = this.cfgPath;
        const cfg = await this.readConfig();

        cfg.buildPath = cfg.buildPath || {};

        if (setAll) {
            for (const v of allDefaults) {
                console.log(BuildId[v.buildId], v.path);
                cfg.buildPath[BuildId[v.buildId]] = v.path;
            }
        } else {
            cfg.buildPath[BuildId[opts.first.buildId]] = opts.path;
        }

        await fs.writeJson(cfgPath, cfg, { spaces: 2 });
    }

    async setToken(which: WhichConfig) {
        const opts = await inquirer.prompt({
            type: 'input',
            name: 'token',
        });

        const cfg = await this.readConfig();

        switch (which) {
            case WhichConfig.CurseForgeToken:
                cfg['curse-forge-token'] = opts.token;
                break;
            case WhichConfig.CurseWowToken:
                cfg['curse-wow-token'] = opts.token;
                break;
            case WhichConfig.GithubToken:
                cfg['github-token'] = opts.token;
                break;
        }

        await fs.writeJson(this.cfgPath, cfg, { spaces: 2 });
    }

    async readConfig() {
        try {
            return await fs.readJson(this.cfgPath);
        } catch {}
        return {};
    }
}

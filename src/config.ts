/**
 * @File   : config.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 6/4/2021, 12:22:39 AM
 */

import * as os from 'os';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';

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

    async buildPath() {
        const opts = await inquirer.prompt([
            {
                type: 'input',
                name: 'buildId',
            },
            {
                type: 'input',
                name: 'path',
            },
        ]);

        const cfgPath = `${os.homedir()}/.wct.json`;
        let cfg;
        try {
            cfg = await fs.readJson(cfgPath, { throws: false });
        } catch {}

        if (!cfg) {
            cfg = {};
        }

        cfg.buildPath = cfg.buildPath || {};
        cfg.buildPath[opts.buildId] = opts.path;

        await fs.writeJson(cfgPath, cfg);
    }
}

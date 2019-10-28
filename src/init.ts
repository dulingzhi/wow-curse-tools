/**
 * @File   : init.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:35:35 AM
 */

import * as path from 'path';
import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';

class Init {
    constructor() {}

    async run() {
        const guessName = path.basename(path.resolve('./'));
        const opts = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Addon Name:', default: guessName },
            { type: 'number', name: 'curse_id', message: 'Curse Project ID:' }
        ]);

        const pkg = await fs.readJson('package.json');
        if (!pkg.wow) {
            pkg.wow = {};
        }
        const wow = pkg.wow;

        wow.name = opts.name;
        wow.curse_id = opts.curse_id;

        await fs.writeJson('package.json', pkg, {
            spaces: 2,
            encoding: 'utf-8'
        });
    }
}

export default new Init();

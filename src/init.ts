/**
 * @File   : init.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:35:35 AM
 */

import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';

export class Init {
    constructor() {}

    async run() {
        const opts = await inquirer.prompt([{ type: 'input', name: 'name' }, { type: 'number', name: 'curse_id' }]);

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

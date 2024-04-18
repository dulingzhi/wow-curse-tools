/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:25:48 PM
 */

import { gEnv } from '../lib/env';
import { Project } from '../lib/project';
// import fs = require('fs-extra');

export class Update {
    async run() {
        const prj = new Project();
        await prj.init();

        // console.log(fs.readFileSync(JSON.parse(process.env.GITHUB_CONTEXT as string).event_path, 'utf-8'));

        if (prj.buildEnvs.size < 1) {
            console.error('No build envs found');
            return;
        }

        gEnv.setEnv(prj.buildEnvs.values().next().value);

        await prj.fetchRemoteFiles();
    }
}

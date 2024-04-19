/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:25:48 PM
 */

import { BuildId, gEnv } from '../lib/env';
import { Project } from '../lib/project';

export class Update {
    async run() {
        const prj = new Project();
        await prj.init();

        if (prj.buildEnvs.size < 1) {
            console.error('No build envs found');
            return;
        }

        for (const [buildId, env] of prj.buildEnvs) {
            console.log(`Update ${BuildId[buildId]}`);
            gEnv.setEnv(env);
            await prj.fetchRemoteFiles();
        }
    }
}

/**
 * @File   : package.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/6/2021, 5:48:39 PM
 */

import { AddonFlusher } from './lib/addon';
import { Project } from './lib/project';

export class Package {
    async run(builds?: string[]) {
        const project = new Project();
        await project.init();

        for (const [pid] of project.buildEnvs) {
            if (!builds || builds.includes(pid)) {
                const fileName = project.genFileName(pid);
                console.log(`Creating package ${fileName} ...`);

                const addon = new AddonFlusher(project, pid);
                await addon.flush(project.genFileName(pid));
                console.log(`Package ${fileName} done.`);
            }
        }
    }
}

/**
 * @File   : package.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/6/2021, 5:48:39 PM
 */

import { BuildId } from '../lib/env';
import { Flusher } from '../lib/flusher';
import { Project } from '../lib/project';

export class Package {
    async run(builds?: BuildId[]) {
        const project = new Project();
        await project.init();

        if (project.single) {
            const fileName = project.genFileName();
            console.log(`Creating package ${fileName} ...`);
            const flusher = new Flusher(project, project.buildEnvs.keys().next().value);
            await flusher.flush(fileName);
            console.log(`Package ${fileName} done.`);
        } else {
            for (const [buildId] of project.buildEnvs) {
                if (!builds || builds.includes(buildId)) {
                    const fileName = project.genFileName(buildId);
                    console.log(`Creating package ${fileName} ...`);

                    const flusher = new Flusher(project, buildId);
                    await flusher.flush(project.genFileName(buildId));
                    console.log(`Package ${fileName} done.`);
                }
            }
        }
    }
}

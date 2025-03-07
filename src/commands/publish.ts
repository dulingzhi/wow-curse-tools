/**
 * @File   : publish.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/6/2021, 6:06:30 PM
 */

import * as fs from 'fs-extra';
import { Flusher } from '../lib/flusher';
import { Curse } from '../lib/curse';
import { Project } from '../lib/project';
import { BuildId } from '../lib/env';

export interface PublishOptions {
    token: string;
    builds?: BuildId[];
    oneBuild?: boolean;
}

export class Publish {
    async run(opts: PublishOptions) {
        if (opts.token.length === 0) {
            throw Error('not found token');
        }

        const project = new Project();
        await project.init();

        if (!project.curseId) {
            throw Error('not found curse id');
        }

        const cli = new Curse(project.curseId, opts.token);
        for (const [buildId, env] of project.buildEnvs) {
            if (!opts.builds || opts.builds.includes(buildId)) {
                const wowVersionId = await cli.getGameVersionIdByName(env.wowVersion);
                console.log('wow version id:', wowVersionId);

                const fileName = project.genFileName(buildId);
                if (await fs.exists(fileName)) {
                    console.log(`Creating package ${fileName} ...`);
                    const flusher = new Flusher(project, buildId);
                    await flusher.flush(fileName);
                }

                console.log(`Uploading package ${fileName} ...`);
                await cli.uploadFile(fileName, project.version, wowVersionId, project.changelog);

                console.log(`Publish package ${fileName} done`);
            }
        }
    }
}

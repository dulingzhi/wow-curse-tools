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
    curse?: boolean;
    github?: boolean;
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

        if (opts.github) {
            const changelog =
                project.changelog && project.changelog.length > 0 ? project.changelog : 'No write changelog';
            await fs.writeFile('changelog.txt', changelog);
        }

        const cli = new Curse(project.curseId, opts.token);

        for (const [buildId, env] of project.buildEnvs) {
            if (!opts.builds || opts.builds.includes(buildId)) {
                const flusher = new Flusher(project, buildId);
                const wowVersionId = await cli.getGameVersionIdByName(env.wowVersion);
                console.log('wow version id:', wowVersionId);

                const fileName = project.genFileName(buildId);

                console.log(`Creating package ${fileName} ...`);
                await flusher.flush(fileName);

                if (opts.curse) {
                    console.log(`Uploading package ${fileName} ...`);
                    await cli.uploadFile(fileName, project.version, wowVersionId, project.changelog);
                }

                if (!opts.github) {
                    await fs.unlink(fileName);
                }

                console.log(`Publish package ${fileName} done`);
            }
        }
    }
}

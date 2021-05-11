/**
 * @File   : publish.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/6/2021, 6:06:30 PM
 */

import * as fs from 'fs-extra';
import { AddonFlusher } from './lib/addon';
import { Curse } from './lib/curse';
import { readLocale } from './lib/locale';
import { Project } from './lib/project';

export class Publish {
    async run(token: string, builds?: string[]) {
        if (!token) {
            throw Error('not found token');
        }

        const project = new Project();
        await project.init();

        if (!project.curseId) {
            throw Error('not found curse id');
        }

        const cli = new Curse(project.curseId, token);

        for (const l of project.localizations) {
            const locale = await readLocale(l.file);

            if (locale) {
                await cli.importLocale(l.lang, locale);
            }
        }

        for (const [buildId, env] of project.buildEnvs) {
            if (!builds || builds.includes(buildId)) {
                const addon = new AddonFlusher(project, buildId);
                const wowVersionId = await cli.getGameVersionIdByName(env.wowVersion);
                console.log('wow version id:', wowVersionId);

                const fileName = project.genFileName(buildId);

                console.log(`Creating package ${fileName} ...`);
                await addon.flush(fileName);
                console.log(`Uploading package ${fileName} ...`);
                await cli.uploadFile(fileName, project.version, wowVersionId);
                await fs.unlink(fileName);
                console.log(`Publish package ${fileName} done`);
            }
        }
    }
}

/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:23:14 AM
 */

import * as process from 'process';
import * as program from 'commander';
import * as fs from 'fs-extra';
import { Project } from './lib/project';
import { Addon } from './lib/addon';
import { Curse } from './lib/curse';
import { readLocale } from './lib/locale';
import { Init } from './init';

function main() {
    program
        .command('init')
        .description('Init your addon project.')
        .action(async () => {
            const initer = new Init();
            await initer.run();
        });

    program
        .command('package')
        .description('Package your addon.')
        .action(async () => {
            const project = new Project();
            await project.init();

            for (const [pid, _env] of project.buildEnvs) {
                const fileName = project.genFileName(pid);
                console.log(`Creating package ${fileName} ...`);

                const addon = new Addon(project, pid);
                await addon.flush(project.genFileName(pid));
                console.log(`Package ${fileName} done.`);
            }
        });

    program
        .command('publish')
        .option('-T, --token <token>', 'Your curse API token')
        .description('Publish your addon.')
        .action(async (cmd) => {
            const token: string = cmd.token || process.env.CURSE_TOKEN;
            if (!token) {
                throw Error('not found token');
            }
            const project = new Project();
            await project.init();

            if (!project.curseId) {
                throw Error('not found curse id');
            }

            const cli = new Curse(project.curseId, token);

            for (const [pid, env] of project.buildEnvs) {
                const addon = new Addon(project, pid);
                const wowVersionId = await cli.getGameVersionIdByName(env.wowVersion);
                console.log('wow version id:', wowVersionId);

                for (const l of project.localizations) {
                    const locale = await readLocale(l.file);

                    if (locale) {
                        await cli.importLocale(l.lang, locale);
                    }

                    const fileName = project.genFileName(pid);

                    console.log(`Creating package ${fileName} ...`);
                    await addon.flush(fileName);
                    console.log(`Uploading package ${fileName} ...`);
                    await cli.uploadFile(fileName, project.version, wowVersionId);
                    await fs.unlink(fileName);
                    console.log(`Publish package ${fileName} done`);
                }
            }
        });

    program.parse(process.argv);
}

main();

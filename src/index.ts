/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:23:14 AM
 */

import * as process from 'process';
import * as program from 'commander';
import * as fs from 'fs-extra';
import { gProject } from './lib/project';
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
        .option('-O --obfuscation', 'Code obfuscation')
        .description('Package your addon.')
        .action(async (cmd) => {
            await gProject.init(!!cmd.obfuscation);

            const addon = new Addon();

            console.log('Creating package...');
            await addon.flush();

            addon.outputStream
                .pipe(fs.createWriteStream(`${gProject.name}-${gProject.version}.zip`))
                .on('close', () => console.log('Package done.'));
        });

    program
        .command('publish')
        .option('-O --obfuscation', 'Code obfuscation')
        .option('-T, --token <token>', 'Your curse API token')
        .description('Publish your addon.')
        .action(async (cmd) => {
            const token: string = cmd.token || process.env.CURSE_TOKEN;
            if (!token) {
                throw Error('not found token');
            }
            await gProject.init(!!cmd.obfuscation);

            const addon = new Addon();
            const cli = new Curse(gProject.curseId, token);
            const wowVersionId = await cli.getGameVersionIdByName(gProject.wowVersion);

            console.log('wow version id:', wowVersionId);

            if (gProject.curseId) {
                for (const l of gProject.localizations) {
                    const locale = await readLocale(l.file);

                    if (locale) {
                        await cli.importLocale(l.lang, locale);
                    }
                }

                const file = `${gProject.name}-${gProject.version}.zip`;

                await addon.flush();
                await new Promise((resolve) => {
                    addon.outputStream.pipe(fs.createWriteStream(file)).on('close', () => resolve());
                });
                await cli.uploadFile(file, gProject.version, wowVersionId);
                await fs.unlink(file);
            }

            console.log('Publish done');
        });

    program.parse(process.argv);
}

main();

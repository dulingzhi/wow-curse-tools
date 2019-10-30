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

function main() {
    program
        .command('package')
        .description('Package your addon.')
        .action(async () => {
            await gProject.init();

            const addon = new Addon();
            addon.outputStream
                .pipe(fs.createWriteStream(`${gProject.name}-${gProject.version}.zip`))
                .on('close', () => console.log('Package done.'));

            console.log('Creating package...');
            await addon.flush();
        });

    program
        .command('publish')
        .option('-T, --token <token>', 'Your curse API token')
        .description('Publish your addon.')
        .action(async cmd => {
            const token: string = cmd.token || process.env.CURSE_TOKEN;
            if (!token) {
                throw Error('not found token');
            }
            await gProject.init();

            const addon = new Addon();
            const cli = new Curse(gProject.curseId, token);

            for (const l of gProject.localizations) {
                const locale = await readLocale(l.file);

                if (locale) {
                    cli.importLocale(l.lang, locale);
                }
            }

            cli.uploadFile(addon.outputStream, gProject.version);

            addon.flush();
        });

    program.parse(process.argv);
}

main();

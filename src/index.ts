/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:23:14 AM
 */

import * as process from 'process';
import * as program from 'commander';
import { Init } from './init';
import { Package } from './package';
import { Publish } from './publish';

class App {
    optList(args: string[]) {
        return args.length > 0 ? args : undefined;
    }

    run() {
        program
            .command('init')
            .description('Init your addon project.')
            .action(async () => {
                await new Init().run();
            });

        program
            .command('package')
            .arguments('[builds...]')
            .description('Package your addon.')
            .action(async (args: string[]) => {
                await new Package().run(this.optList(args));
            });

        program
            .command('publish')
            .option('-T, --token <token>', 'Your curse API token')
            .arguments('[builds...]')
            .description('Publish your addon.')
            .action(async (args: string[], opts) => {
                await new Publish().run(opts.token || process.env.CURSE_TOKEN, this.optList(args));
            });

        program.parse(process.argv);
    }
}

new App().run();

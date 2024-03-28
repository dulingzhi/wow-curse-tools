/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:23:14 AM
 */

import * as process from 'process';
import * as program from 'commander';

class App {
    optList(args: string[]) {
        return args.length > 0 ? args : undefined;
    }

    run() {
        program
            .command('init')
            .description('Init your addon project.')
            .action(async () => {
                await new (await import('./init')).Init().run();
            });

        program
            .command('package')
            .arguments('[builds...]')
            .description('Package your addon.')
            .action(async (args: string[]) => {
                await new (await import('./package')).Package().run(this.optList(args));
            });

        program
            .command('publish')
            .option('-T, --token <token>', 'Your curse API token')
            .arguments('[builds...]')
            .description('Publish your addon.')
            .action(async (args: string[], opts) => {
                await new (
                    await import('./publish')
                ).Publish().run(opts.token || process.env.CURSE_TOKEN, this.optList(args));
            });

        program
            .command('build')
            .arguments('[build]')
            .option('-O --output <output>')
            .description('watch the addon')
            .action(async (buildId: string, opts) => {
                await new (await import('./build')).Build().run(opts.output, buildId);
            });

        program
            .command('watch')
            .arguments('[build]')
            .option('-O --output <output>')
            .description('watch the addon')
            .action(async (buildId: string, opts: { output?: string }) => {
                await new (await import('./build')).Build(true).run(opts.output, buildId);
            });

        program
            .command('emmyui')
            .alias('emmylua')
            .alias('emmy')
            .option('--blizzard')
            .description('gen ui')
            .action(async (opts: { blizzard?: boolean }) => {
                await new (await import('./emmy')).Emmy(opts.blizzard).run();
            });

        program
            .command('config')
            .description('config wct')
            .action(async () => {
                await new (await import('./config')).Config().run();
            });

        {
            const c = program.command('locale');

            c.command('export')
                .description('export locale')
                .option('-T, --token <token>', 'Your curse API token')
                .action(async (opts) => {
                    await new (await import('./locale')).Locale(opts.token || process.env.CURSE_TOKEN).export();
                });
        }

        program.parse(process.argv);
    }
}

new App().run();

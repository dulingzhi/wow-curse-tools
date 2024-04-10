/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:23:14 AM
 */

import * as process from 'process';
import { program } from 'commander';
import { gEnv } from './lib/env';
import { Init } from './init';
import { Package } from './package';
import { Publish } from './publish';
import { Build } from './build';
import { Emmy } from './emmy';
import { Config } from './config';
import { Locale } from './locale';

class App {
    optBuilds(args: string[]) {
        const builds = args.map((x) => gEnv.toBuildId(x)).filter((x) => x);
        return builds.length > 0 ? builds : undefined;
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
                await new Package().run(this.optBuilds(args));
            });

        program
            .command('publish')
            .option('-T, --token <token>', 'Your curse API token')
            .option('-G, --release', 'Release from git tag')
            .arguments('[builds...]')
            .description('Publish your addon.')
            .action(async (args: string[], opts) => {
                await new Publish().run({ token: opts.token, builds: this.optBuilds(args), curse: true });
            });

        program
            .command('build')
            .arguments('[build]')
            .option('-O --output <output>')
            .description('watch the addon')
            .action(async (buildKey: string, opts) => {
                const buildId = gEnv.toBuildId(buildKey);
                if (!buildId) {
                    console.error(`Invalid build id: ${buildKey}`);
                    return;
                }
                await new Build().run(opts.output, buildId);
            });

        program
            .command('watch')
            .arguments('[build]')
            .option('-O --output <output>')
            .description('watch the addon')
            .action(async (buildKey: string, opts: { output?: string }) => {
                const buildId = gEnv.toBuildId(buildKey);
                if (!buildId) {
                    console.error(`Invalid build id: ${buildKey}`);
                    return;
                }
                await new Build(true).run(opts.output, buildId);
            });

        program
            .command('emmyui')
            .alias('emmylua')
            .alias('emmy')
            .option('--blizzard')
            .description('gen ui')
            .action(async (opts: { blizzard?: boolean }) => {
                await new Emmy(opts.blizzard).run();
            });

        program
            .command('config')
            .description('config wct')
            .action(async () => {
                await new Config().run();
            });

        {
            const locale = program.command('locale');

            locale
                .command('export')
                .description('export locale')
                .option('-T, --token <token>', 'Your curse API token')
                .action(async (opts) => {
                    await new Locale(opts.token || process.env.CURSE_TOKEN).export();
                });

            locale
                .command('import')
                .description('import locale')
                .option('-T, --token <token>', 'Your curse API token')
                .action(async (opts) => {
                    await new Locale(opts.token || process.env.CURSE_TOKEN).import();
                });

            locale
                .command('scan')
                .description('scan locale')
                .action(async () => {
                    await new Locale('').scan();
                });
        }

        program.parse(process.argv);
    }
}

new App().run();

/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:23:14 AM
 */

import * as process from 'process';
import * as program from 'commander';
import { Init } from './init';

function main() {
    program
        .command('init')
        .description('init wow curse project')
        .action(() => {
            new Init().run();
        });

    program
        .command('package')
        .description('package')
        .action(() => {
            console.log('package');
        });
    program.parse(process.argv);
}

main();

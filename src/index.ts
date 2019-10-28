/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 11:23:14 AM
 */

import * as process from 'process';
import * as program from 'commander';

function main() {
    const commands = {
        package: 'Package your addon',
        init: 'Init wow curse project'
    };

    for (const [key, desc] of Object.entries(commands)) {
        program
            .command(key)
            .description(desc)
            .action(async () => {
                (await import('./' + key)).default.run();
            });
    }

    program.parse(process.argv);
}

main();

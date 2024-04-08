/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/8/2024, 8:20:54 PM
 */

import * as core from '@actions/core';
import { Locale } from '../locale';

async function run() {
    const token = core.getInput('token', { required: true });
    const locale = new Locale(token);

    console.log('Scan locales');
    await locale.scan();

    console.log('Import locales');
    await locale.import();

    console.log('Export locales');
    await locale.export();
}

run();
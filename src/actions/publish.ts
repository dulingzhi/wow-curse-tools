/**
 * @File   : publish.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/8/2024, 8:23:31 PM
 */

import * as core from '@actions/core';
import { Publish } from '../commands/publish';

async function run() {
    const token = core.getInput('curse-wow-token', { required: true });

    const publish = new Publish();
    await publish.run({ token });
}

run();

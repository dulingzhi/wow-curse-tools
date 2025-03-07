/**
 * @File   : nga.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/7/2025, 12:13:52 PM
 */

import * as core from '@actions/core';
import { NgaPublish } from '../commands/nga';

async function run() {
    const cookie = core.getInput('nga-cookie', { required: true });

    const nga = new NgaPublish();
    await nga.run({ cookie });
}

run();

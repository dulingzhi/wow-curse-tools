/**
 * @File   : build.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/19/2024, 8:17:41 PM
 */

import path = require('path');
import { Build } from '../commands/build';
import { BuildId, gEnv } from '../lib/env';
import { Project } from '../lib/project';

async function run() {
    const prj = new Project();

    for (const [buildId, env] of prj.buildEnvs) {
        gEnv.setEnv(env);

        await new Build().run(path.join('.build', BuildId[buildId]), buildId);
    }
}

run();

/**
 * @File   : changelog.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/7/2025, 12:17:36 PM
 */

import * as fs from 'fs-extra';
import { Project } from "../lib/project";

async function run() {
    const project = new Project();
    await project.init();

    if (project.changelog && project.changelog.length > 0) {
        await fs.writeFile('changelog.txt', project.changelog || 'no changelog');
    }
}

run();

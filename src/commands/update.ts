/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:25:48 PM
 */

import { Project } from '../lib/project';

export class Update {
    async run() {
        const prj = new Project();
        await prj.init();
        await prj.fetchRemoteFiles();
    }
}

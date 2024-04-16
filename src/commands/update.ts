/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:25:48 PM
 */

import { Project } from '../lib/project';

export class Update {
    private project: Project;

    async run() {
        await this.project.init();
        await this.project.fetchRemoteFiles();
    }
}

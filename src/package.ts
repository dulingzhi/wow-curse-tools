/**
 * @File   : package.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 5:38:42 PM
 */

import { Pack } from './lib/pack';
import { Project } from './lib/project';
import { Locale } from './lib/locale';
import { Upload } from './lib/upload';

export class Package {
    async run() {
        const project = new Project();
        await project.init();

        const locale = await Locale.create(project);
        await locale.run();

        const pack = new Pack(project);
        await pack.run();

        const upload = new Upload(project);
        await upload.run();
    }
}

export default new Package();

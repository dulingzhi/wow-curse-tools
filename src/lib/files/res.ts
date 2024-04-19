/**
 * @File   : res.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:27:46 PM
 */

import path = require('path');
import { glob } from 'fast-glob';
import { gEnv } from '../env';

export class ResFilesFinder {
    async findFiles(folder: string) {
        const files = await glob.async(
            [
                '**.blp',
                '**.tga',
                '**.m2',
                'bindings.xml',
                '**license*',
                '**/license*',
                ...((gEnv.env && gEnv.env.resFilters) || []),
            ],
            { cwd: folder, caseSensitiveMatch: false }
        );
        return files.map((p) => path.resolve(p));
    }
}

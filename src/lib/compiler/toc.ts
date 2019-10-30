/**
 * @File   : toc.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:21 PM
 */

import { Compiler } from './compiler';
import { gProject } from '../project';

export class TocCompiler implements Compiler {
    compile(code: string) {
        return code.replace(/@project-version@/g, gProject.version);
    }
}

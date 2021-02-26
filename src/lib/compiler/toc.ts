/**
 * @File   : toc.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:21 PM
 */

import { Compiler, gCompilerManager } from './compiler';

export class TocCompiler implements Compiler {
    compile(code: string) {
        const env = gCompilerManager.env;
        const sb = [];
        let inDebug = false;

        for (const line of code.split(/\r\n|\r|\n/g)) {
            if (line.trim() === '#@debug@') {
                inDebug = true;
            } else if (line.trim() === '#@end-debug@') {
                inDebug = false;
            } else if (!inDebug) {
                sb.push(line);
            }
        }

        code = sb.join('\n');

        return code
            .replace(/#@project-version@/g, `## Version: ${env.version}`)
            .replace(/#@project-interface@/g, `## Interface: ${env.build}`)
            .replace(/@project-version@/g, env.version);
    }
}

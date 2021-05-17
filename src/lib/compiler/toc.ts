/**
 * @File   : toc.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:21 PM
 */

import { gEnv } from '../env';
import { Compiler } from './compiler';

export class TocCompiler implements Compiler {
    compile(code: string) {
        const env = gEnv.env;
        const sb = [];
        const version = env.version.split('-')[0];

        let inDebug = false;

        for (const line of code.split(/\r\n|\r|\n/g)) {
            if (!env.debug) {
                if (line.trim() === '#@debug@') {
                    inDebug = true;
                    continue;
                } else if (line.trim() === '#@end-debug@') {
                    inDebug = false;
                    continue;
                } else if (inDebug) {
                    continue;
                }
            }
            if (!inDebug) {
                sb.push(line);
            }
        }

        code = sb.join('\n');

        return code
            .replace(/#@project-version@/g, `## Version: ${version}`)
            .replace(/#@project-interface@/g, `## Interface: ${env.buildInfo.interface}`)
            .replace(/@project-version@/g, version);
    }
}

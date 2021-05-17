/**
 * @File   : lua.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:32 PM
 */

import { gEnv } from '../env';
import { Compiler } from './compiler';

export class LuaCompiler implements Compiler {
    compile(code: string) {
        code = code.replace(/---@.+/g, '');

        if (!gEnv.env.debug) {
            code = code
                .replace(/--\s*@debug@/g, '--[===[@debug@')
                .replace(/--\s*@end-debug@/g, '--@end-debug@]===]')
                .replace(/--\[=*\[@non-debug@/g, '--@non-debug@')
                .replace(/--@end-non-debug@\]=*\]/g, '--@end-non-debug@');
        }

        const buildId = gEnv.env.buildId;
        if (buildId !== 'none') {
            code = code
                .replace(new RegExp(`--\\[=*\\[@${buildId}@`, 'g'), `--@${buildId}@`)
                .replace(new RegExp(`--@end-${buildId}@\\]=*\\]`, 'g'), `--@end-${buildId}@`);
        }
        return code;
    }
}

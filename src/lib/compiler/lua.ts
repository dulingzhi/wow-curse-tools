/**
 * @File   : lua.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:32 PM
 */

import { Compiler } from './compiler';

export class LuaCompiler implements Compiler {
    compile(code: string) {
        return code
            .replace(/--\s*@debug@/g, '--[===[@debug@')
            .replace(/--\s*@end-debug@/g, '--@end-debug@]===]')
            .replace(/--\[=*\[@non-debug@/g, '--@non-debug@')
            .replace(/--@end-non-debug@\]=*\]/g, '--@end-non-debug@');
    }
}

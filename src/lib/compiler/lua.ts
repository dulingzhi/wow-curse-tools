/**
 * @File   : lua.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:32 PM
 */

import { Compiler } from './compiler';
import * as luamin from 'luamin';
import { gProject } from '../project';

export class LuaCompiler implements Compiler {
    compile(code: string) {
        let c = code
            .replace(/--\s*@debug@/g, '--[===[@debug@')
            .replace(/--\s*@end-debug@/g, '--@end-debug@]===]')
            .replace(/--\[=*\[@non-debug@/g, '--@non-debug@')
            .replace(/--@end-non-debug@\]=*\]/g, '--@end-non-debug@');
        if (gProject.obfuscation) {
            c = luamin.minify(c);
        }
        return c;
    }
}

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
        const eq = this.getCommentEqual(code);

        return code
            .replace(/--\s*@(?<!end-|non-)(\w+)@/g, (r, x) => (gEnv.checkCondition(x) ? r : `--[${eq}[@${x}@`))
            .replace(/--\s*@end-(?<!non-)(\w+)@/g, (r, x) => (gEnv.checkCondition(x) ? r : `--@end-${x}@]${eq}]`))
            .replace(/--\[=*\[@non-(\w+)@/g, (r, x) => (gEnv.checkCondition(x) ? r : `--@non-${x}@`))
            .replace(/--@end-non-(\w+)@\]=*\]/g, (r, x) => (gEnv.checkCondition(x) ? r : `--@end-non-${x}@`))
            .replace(/--\s*@non-(\w+)@/g, (r, x) => (!gEnv.checkCondition(x) ? r : `--[${eq}[@non-${x}@`))
            .replace(/--\s*@end-non-(\w+)@(?!\])/, (r, x) => (!gEnv.checkCondition(x) ? r : `--@end-non-${x}@]${eq}]`))
            .replace(/--\s*@build([><=]+)(\d+)@/g, (r, o, b) =>
                gEnv.checkBuild(o, b) ? r : `--[${eq}[@build${o}${b}@`
            )
            .replace(/--\s*@end-build([><=]+)(\d+)@(?!\])/g, (r, o, b) =>
                gEnv.checkBuild(o, b) ? r : `--@end-build${o}${b}@]${eq}]`
            );
    }

    protected getCommentEqual(code: string) {
        const m = code.match(/\[(=*)\[|\](=*)\]/g);
        const exists = new Set(m ? m.map((x) => x.length - 2) : []);

        let length = 0;
        while (exists.has(length)) {
            length++;
        }
        return '='.repeat(length);
    }
}

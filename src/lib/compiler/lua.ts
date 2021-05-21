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
        const m = new Map<string, boolean>([
            ['debug', gEnv.env.debug],
            ['release', !gEnv.env.debug],
            ...gEnv.env.builds.map<[string, boolean]>((x) => [x, x === gEnv.env.buildId]),
        ]);

        const is = (x: string) => {
            return m.has(x) && m.get(x);
        };

        return code
            .replace(/--\s*@(?<!end-|non-)(\w+)@/g, (r, x) => (is(x) ? r : `--[${eq}[@${x}@`))
            .replace(/--\s*@end-(?<!non-)(\w+)@/g, (r, x) => (is(x) ? r : `--@end-${x}@]${eq}]`))
            .replace(/--\[=*\[@non-(\w+)@/g, (r, x) => (is(x) ? r : `--@non-${x}@`))
            .replace(/--@end-non-(\w+)@\]=*\]/g, (r, x) => (is(x) ? r : `--@end-non-${x}@`));
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

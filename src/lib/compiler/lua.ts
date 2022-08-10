/**
 * @File   : lua.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:32 PM
 */

import { gEnv } from '../env';
import { Compiler } from './compiler';

type ReplacerFunc = (eq: string, a1: string, ...args: string[]) => string;
type ReplacerItem = { r: RegExp; f: ReplacerFunc };
type ReplacerPair = [ReplacerItem, ReplacerItem];

export class LuaCompiler implements Compiler {
    private commentEquals: Set<number>;
    private lastEqualsLength = 0;
    private replacers: ReplacerPair[] = [
        [
            {
                r: /--\s*@(?<!end-|non-)(\w+)@/g,
                f: (e, s, x) => (gEnv.checkCondition(x) ? s : `--[${e}[@${x}@`),
            },
            {
                r: /--\s*@end-(?<!non-)(\w+)@/g,
                f: (e, s, x) => (gEnv.checkCondition(x) ? s : `--@end-${x}@]${e}]`),
            },
        ],
        [
            {
                r: /--\[=*\[@non-(\w+)@/g,
                f: (_, s, x) => (gEnv.checkCondition(x) ? s : `--@non-${x}@`),
            },
            {
                r: /--@end-non-(\w+)@\]=*\]/g,
                f: (_, s, x) => (gEnv.checkCondition(x) ? s : `--@end-non-${x}@`),
            },
        ],
        [
            {
                r: /--\s*@non-(\w+)@/g,
                f: (e, s, x) => (!gEnv.checkCondition(x) ? s : `--[${e}[@non-${x}@`),
            },
            {
                r: /--\s*@end-non-(\w+)@(?!\])/,
                f: (e, s, x) => (!gEnv.checkCondition(x) ? s : `--@end-non-${x}@]${e}]`),
            },
        ],
        [
            {
                r: /--\s*@build([><=]+)(\d+)@/g,
                f: (e, s, o, b) => (gEnv.checkBuild(o, b) ? s : `--[${e}[@build${o}${b}@`),
            },
            {
                r: /--\s*@end-build([><=]+)(\d+)@(?!\])/g,
                f: (e, s, o, b) => (gEnv.checkBuild(o, b) ? s : `--@end-build${o}${b}@]${e}]`),
            },
        ],
    ];

    compile(code: string) {
        this.prepareCommentEqual(code);

        for (const item of this.replacers) {
            const equal = this.generateCommentEqual();
            for (const { r, f } of item) {
                code = code.replace(r, (...args) => f(equal, ...args));
            }
        }
        return code;
    }

    protected prepareCommentEqual(code: string) {
        const m = code.match(/\[(=*)\[|\](=*)\]/g);
        this.commentEquals = new Set(m ? m.map((x) => x.length - 2) : []);
    }

    protected generateCommentEqual() {
        while (this.commentEquals.has(this.lastEqualsLength)) {
            this.lastEqualsLength++;
        }
        return '='.repeat(this.lastEqualsLength);
    }
}

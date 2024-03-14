/**
 * @File   : lua.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:32 PM
 */

import { gEnv } from '../env';
import { Compiler } from './compiler';

type ReplacerFunc = (a1: string, ...args: string[]) => string;
type ReplacerItem = { r: RegExp; f: ReplacerFunc };
type ReplacerPair = [ReplacerItem, ReplacerItem];

export class LuaCompiler implements Compiler {
    private commentEquals: Set<number>;
    private lastEqualsLength = 0;
    private equals = new Map<string, string>();
    private replacers: ReplacerPair[] = [
        [
            {
                r: /--\s*@(?<!end-|non-)(\w+)@/g,
                f: (s, x) => (gEnv.checkCondition(x) ? s : `--[${this.getEqual(x)}[@${x}@`),
            },
            {
                r: /--\s*@end-(?<!non-)(\w+)@/g,
                f: (s, x) => (gEnv.checkCondition(x) ? s : `--@end-${x}@]${this.getEqual(x)}]`),
            },
        ],
        [
            {
                r: /--\[=*\[@non-(\w+)@/g,
                f: (s, x) => (gEnv.checkCondition(x) ? s : `--@non-${x}@`),
            },
            {
                r: /--@end-non-(\w+)@\]=*\]/g,
                f: (s, x) => (gEnv.checkCondition(x) ? s : `--@end-non-${x}@`),
            },
        ],
        [
            {
                r: /--\s*@non-(\w+)@/g,
                f: (s, x) => (!gEnv.checkCondition(x) ? s : `--[${this.getEqual('non', x)}[@non-${x}@`),
            },
            {
                r: /--\s*@end-non-(\w+)@(?!\])/g,
                f: (s, x) => (!gEnv.checkCondition(x) ? s : `--@end-non-${x}@]${this.getEqual('non', x)}]`),
            },
        ],
        [
            {
                r: /--\s*@build([><=]+)(\d+)@/g,
                f: (s, o, b) => (gEnv.checkBuild(o, b) ? s : `--[${this.getEqual('build', o, b)}[@build${o}${b}@`),
            },
            {
                r: /--\s*@end-build([><=]+)(\d+)@(?!\])/g,
                f: (s, o, b) => (gEnv.checkBuild(o, b) ? s : `--@end-build${o}${b}@]${this.getEqual('build', o, b)}]`),
            },
        ],
    ];

    compile(code: string) {
        this.prepareCommentEqual(code);

        for (const item of this.replacers) {
            for (const { r, f } of item) {
                code = code.replace(r, (...args) => f(...args));
            }
        }
        return code;
    }

    protected prepareCommentEqual(code: string) {
        const m = code.match(/\[(=*)\[|\](=*)\]/g);
        this.commentEquals = new Set(m ? m.map((x) => x.length - 2) : []);
        this.lastEqualsLength = 0;
        this.equals.clear();
    }

    protected generateCommentEqual() {
        while (this.commentEquals.has(this.lastEqualsLength)) {
            this.lastEqualsLength++;
        }
        this.commentEquals.add(this.lastEqualsLength);
        console.log(this.lastEqualsLength);
        return '='.repeat(this.lastEqualsLength);
    }

    protected getEqual(...args: string[]) {
        const key = args.map((x) => x.trim()).join(' ');
        if (this.equals.has(key)) {
            return this.equals.get(key);
        }
        const equal = this.generateCommentEqual();
        this.equals.set(key, equal);
        return equal;
    }
}

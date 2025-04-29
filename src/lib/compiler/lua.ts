/**
 * @File   : lua.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:32 PM
 */

import { gEnv } from '../env';
import { Compiler } from './compiler';

type ReplacerFunc = (a1: string, ...args: string[]) => string;
type ReplacerItem = { pattern: RegExp; replacer: ReplacerFunc, validate?: () => boolean };
type ReplacerPair = [ReplacerItem, ReplacerItem];

export class LuaCompiler implements Compiler {
    private commentEquals: Set<number>;
    private lastEqualsLength = 0;
    private equals = new Map<string, string>();
    private replacers: ReplacerPair[] = [
        [
            {
                pattern: /--\s*@(?<!end-|non-)(\w+)@/g,
                replacer: (s, x) => (gEnv.checkCondition(x) ? s : `--[${this.getEqual(x)}[@${x}@`),
            },
            {
                pattern: /--\s*@end-(?<!non-)(\w+)@/g,
                replacer: (s, x) => (gEnv.checkCondition(x) ? s : `--@end-${x}@]${this.getEqual(x)}]`),
            },
        ],
        [
            {
                pattern: /--\[=*\[@non-(\w+)@/g,
                replacer: (s, x) => (gEnv.checkCondition(x) ? s : `--@non-${x}@`),
            },
            {
                pattern: /--@end-non-(\w+)@\]=*\]/g,
                replacer: (s, x) => (gEnv.checkCondition(x) ? s : `--@end-non-${x}@`),
            },
        ],
        [
            {
                pattern: /--\s*@non-(\w+)@/g,
                replacer: (s, x) => (!gEnv.checkCondition(x) ? s : `--[${this.getEqual('non', x)}[@non-${x}@`),
            },
            {
                pattern: /--\s*@end-non-(\w+)@(?!\])/g,
                replacer: (s, x) => (!gEnv.checkCondition(x) ? s : `--@end-non-${x}@]${this.getEqual('non', x)}]`),
            },
        ],
        [
            {
                pattern: /--\s*@build([><=!~^]+)(\d+)@/g,
                replacer: (s, o, b) => (gEnv.checkBuild(o, b) ? s : `--[${this.getEqual('build', o, b)}[@build${o}${b}@`),
                validate: () => !gEnv.env.single,
            },
            {
                pattern: /--\s*@end-build([><=!~^]+)(\d+)@(?!\])/g,
                replacer: (s, o, b) => (gEnv.checkBuild(o, b) ? s : `--@end-build${o}${b}@]${this.getEqual('build', o, b)}]`),
                validate: () => !gEnv.env.single,
            },
        ],
    ];

    compile(code: string) {
        this.prepareCommentEqual(code);

        for (const item of this.replacers) {
            for (const { pattern, replacer, validate } of item) {
                if (!validate || validate()) {
                    code = code.replace(pattern, (...args) => replacer(...args));
                }
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

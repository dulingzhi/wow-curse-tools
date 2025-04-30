/**
 * @File   : compiler.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:01:40 PM
 */

import * as path from 'path';
import { readFile } from '../util';
import { BuildId } from '../env';

export interface Compiler {
    compile(code: string, buildId?: BuildId): string | undefined;
}

class CompilerManager {
    private _compilers = new Map<string, Compiler>();

    register(ext: string, compiler: Compiler) {
        this._compilers.set(ext, compiler);
    }

    async compile(filePath: string, buildId?: BuildId) {
        const ext = path.extname(filePath);
        const compiler = this._compilers.get(ext);

        if (!compiler) {
            return;
        }
        return compiler.compile(await readFile(filePath), buildId);
    }
}

export const gCompilerManager = new CompilerManager();

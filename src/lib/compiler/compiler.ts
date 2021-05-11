/**
 * @File   : compiler.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:01:40 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

export interface Compiler {
    compile(code: string): string | undefined;
}

export interface BuildInfo {
    interface: string;
}

export interface CompilerEnv {
    buildId: string;
    buildInfo: BuildInfo;
    version: string;
    wowVersion: string;
}

class CompilerManager {
    private _env: CompilerEnv;
    private _compilers = new Map<string, Compiler>();

    get env() {
        return this._env;
    }

    register(ext: string, compiler: Compiler) {
        this._compilers.set(ext, compiler);
    }

    async compile(file: string) {
        const ext = path.extname(file);
        const compiler = this._compilers.get(ext);

        if (!compiler) {
            return;
        }
        return compiler.compile(await fs.readFile(file, { encoding: 'utf-8' }));
    }

    setEnv(env: CompilerEnv) {
        this._env = env;
    }
}

export const gCompilerManager = new CompilerManager();

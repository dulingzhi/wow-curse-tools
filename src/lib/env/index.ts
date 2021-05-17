/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/17/2021, 2:51:02 PM
 */

export interface BuildInfo {
    interface: string;
}

export interface CompilerEnv {
    buildId: string;
    buildInfo: BuildInfo;
    version: string;
    wowVersion: string;
    debug: boolean;
}

class EnvManager {
    private _env: CompilerEnv;

    get env() {
        return this._env;
    }

    setEnv(env: CompilerEnv) {
        this._env = env;
    }
}

export const gEnv = new EnvManager();

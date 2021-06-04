/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/17/2021, 2:51:02 PM
 */

export interface BuildInfo {
    interface: string;
}

export interface Env {
    buildId: string;
    buildInfo: BuildInfo;
    version: string;
    wowVersion: string;
    debug: boolean;
    builds: string[];
}

class EnvManager {
    private _env: Env;
    private _conditions?: Map<string, boolean>;

    get env() {
        return this._env;
    }

    setEnv(env: Env) {
        this._env = env;
        this._conditions = new Map<string, boolean>([
            ['debug', env.debug],
            ['release', !env.debug],
            ['import', true],
            ...env.builds.map<[string, boolean]>((x) => [x, x === env.buildId]),
        ]);
    }

    checkCondition(condition: string) {
        return this._conditions?.has(condition) && this._conditions.get(condition);
    }
}

export const gEnv = new EnvManager();

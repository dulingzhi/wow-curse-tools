/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/17/2021, 2:51:02 PM
 */

export interface BuildInfo {
    interface: string;
}

export enum BuildId {
    Unknown = 0,
    Retail,
    Classic,
    Wrath,
}

export interface Env {
    buildId: BuildId;
    buildInfo: BuildInfo;
    version: string;
    wowVersion: string;
    debug: boolean;
    builds: BuildId[];
    resFilters: string[];
}

interface BuildIdData {
    path: string;
    suffix: string;
    atlas?: string[];
}

class EnvManager {
    private _env: Env;
    private _conditions?: Map<string, boolean>;
    private _buildData: Map<BuildId, BuildIdData> = new Map([
        [BuildId.Classic, { path: '_classic_era_', suffix: 'Classic', atlas: ['classic'] }],
        [BuildId.Wrath, { path: '_classic_', suffix: 'Wrath', atlas: ['lkc', 'wrath'] }],
        [BuildId.Retail, { path: '_retail_', suffix: '', atlas: ['retail'] }],
    ]);

    get env() {
        return this._env;
    }

    setEnv(env: Env) {
        this._env = env;
        this._conditions = new Map<string, boolean>([
            ['debug', env.debug],
            ['release', !env.debug],
            ['import', true],
            // ...env.builds.map<[BuildId, boolean]>((x) => [x, x === env.buildId]),
        ]);
    }

    toBuildId(key: string) {
        const e = BuildId[key as keyof typeof BuildId];
        if (e && this._buildData?.has(e)) {
            return e;
        }

        for (const [k, v] of this._buildData?.entries()) {
            if (v.atlas?.includes(key)) {
                return k;
            }
        }
        return BuildId.Unknown;
    }

    getBuildSuffix(buildId: BuildId) {
        return this._buildData.get(buildId)?.suffix;
    }

    getBuildDirName(buildId: BuildId) {
        return this._buildData.get(buildId)?.path;
    }

    checkCondition(condition: string) {
        return this._conditions?.has(condition) && this._conditions.get(condition);
    }

    checkBuild(op: string, v: string) {
        let ver = Number.parseInt(v);
        if (!ver) {
            throw Error(`unknown version: ${v}`);
        }

        if (ver < 10000) {
            ver *= 10000;
        }

        const version = Number.parseInt(this._env.buildInfo.interface);

        switch (op) {
            case '>':
                return version > ver;
            case '>=':
                return version >= ver;
            case '<':
                return version < ver;
            case '<=':
                return version <= ver;
            case '=':
                return version === ver;
            default:
                throw Error(`unknown op: ${op}`);
        }
    }
}

export const gEnv = new EnvManager();

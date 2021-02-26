/**
 * @File   : project.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 5:28:51 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { CompilerEnv } from './compiler/compiler';

interface Addon {
    name: string;
    folder: string;
}

interface Localization {
    lang: string;
    file: string;
}

interface BuildMap {
    classic: string;
    retail: string;
}

interface WowPackage {
    name: string;
    curse_id?: number;
    builds?: BuildMap;
    localizations?: any;
}

export class Project implements Addon {
    private _name: string;
    private _version: string;
    private _curseId: number;
    private _folder: string;
    private _addons: Addon[] = [];
    private _localizations: Localization[] = [];
    private _buildEnvs = new Map<string, CompilerEnv>();

    constructor() {}

    get name() {
        return this._name;
    }

    get folder() {
        return this._folder;
    }

    get version() {
        return this._version;
    }

    get curseId() {
        return this._curseId;
    }

    get addons() {
        return this._addons;
    }

    get localizations() {
        return this._localizations;
    }

    get buildEnvs() {
        return this._buildEnvs;
    }

    genFileName(pid: string) {
        if (!pid || pid === 'none') {
            return `${this.name}-${this.version}.zip`;
        } else {
            return `${this.name}-${pid}-${this.version}.zip`;
        }
    }

    private parseWowVersion(t: string) {
        const mm = t.match(/^(\d*)(\d\d)(\d\d)$/);
        if (mm) {
            return `${Number.parseInt(mm[1])}.${Number.parseInt(mm[2])}.${Number.parseInt(mm[3])}`;
        }
        return '';
    }

    async init() {
        const pkg = await fs.readJson('./package.json');

        if (!pkg.wow || !pkg.wow.name) {
            throw Error('not a wow curse project');
        }

        const p: WowPackage = pkg.wow;

        this._folder = path.resolve('./');
        this._name = p.name;
        this._version = pkg.version;
        this._curseId = p.curse_id || 0;

        if (p.builds) {
            for (const [pid, build] of Object.entries(p.builds)) {
                this._buildEnvs.set(pid, {
                    build,
                    pid,
                    version: this._version,
                    wowVersion: this.parseWowVersion(build),
                });
            }
        }

        if (this._buildEnvs.size === 0) {
            const toc = await fs.readFile(`./${pkg.wow.name}.toc`, { encoding: 'utf-8' });
            const m = toc.match(/##\s*Interface\s*:\s*(\d+)/);
            if (m) {
                this._buildEnvs.set('none', {
                    pid: 'none',
                    build: m[1],
                    version: this._version,
                    wowVersion: this.parseWowVersion(m[1]),
                });
            }
        }

        this._addons.push(this);

        if (pkg.wow.addons) {
            for (const [key, v] of Object.entries(pkg.wow.addons)) {
                this._addons.push({
                    name: key,
                    folder: v as string,
                });
            }
        }

        if (pkg.wow.localizations) {
            for (const [key, v] of Object.entries(pkg.wow.localizations)) {
                this._localizations.push({
                    lang: key,
                    file: v as string,
                });
            }
        }
    }
}

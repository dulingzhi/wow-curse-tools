/**
 * @File   : project.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 5:28:51 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';

interface Addon {
    name: string;
    folder: string;
}

interface Localization {
    lang: string;
    file: string;
}

class Project implements Addon {
    private _name: string;
    private _version: string;
    private _curseId: number;
    private _folder: string;
    private _wowVersion: string;
    private _addons: Addon[] = [];
    private _localizations: Localization[] = [];
    private _obfuscation: boolean = false;

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

    get wowVersion() {
        return this._wowVersion;
    }

    get addons() {
        return this._addons;
    }

    get localizations() {
        return this._localizations;
    }

    get obfuscation() {
        return this._obfuscation;
    }

    async init(obfu: boolean) {
        const pkg = await fs.readJson('./package.json');

        if (!pkg.wow || !pkg.wow.name) {
            throw Error('not a wow curse project');
        }

        const toc = await fs.readFile(`./${pkg.wow.name}.toc`, { encoding: 'utf-8' });
        const m = toc.match(/##\s*Interface\s*:\s*(\d+)/);
        if (m) {
            const verion = m[1];
            const mm = verion.match(/^(\d*)(\d\d)(\d\d)$/);
            if (mm) {
                this._wowVersion = `${Number.parseInt(mm[1])}.${Number.parseInt(mm[2])}.${Number.parseInt(mm[3])}`;
            }
        }

        this._folder = path.resolve('./');
        this._name = pkg.wow.name as string;
        this._version = pkg.version as string;
        this._curseId = pkg.wow.curse_id as number;
        this._obfuscation = obfu;

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

export const gProject = new Project();

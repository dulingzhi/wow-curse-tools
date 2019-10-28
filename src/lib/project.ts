/**
 * @File   : project.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 5:28:51 PM
 */

import * as process from 'process';
import * as path from 'path';
import * as fs from 'fs-extra';

export class Project {
    private _name: string;
    private _version: string;
    private _curseId: number;
    private _otherAddons = new Map<string, string>();
    private _localizations = new Map<string, string>();
    private _token = process.env.CURSE_TOKEN;

    constructor() {}

    get name() {
        return this._name;
    }

    get version() {
        return this._version;
    }

    get curseId() {
        return this._curseId;
    }

    get otherAddons() {
        return this._otherAddons;
    }

    get localizations() {
        return this._localizations;
    }

    get token() {
        return this._token;
    }

    async init() {
        const pkg = await fs.readJson('./package.json');

        if (!pkg.wow || !pkg.wow.name) {
            throw Error('not a wow curse project');
        }

        this._name = pkg.wow.name as string;
        this._version = pkg.version as string;
        this._curseId = pkg.wow.curse_id as number;

        if (pkg.wow.addons) {
            for (const [key, p] of Object.entries(pkg.wow.addons)) {
                this.otherAddons.set(key, path.resolve(p as string));
            }
        }

        if (pkg.wow.localizations) {
            for (const [key, p] of Object.entries(pkg.wow.localizations)) {
                this._localizations.set(key, path.resolve(p as string));
            }
        }
    }
}

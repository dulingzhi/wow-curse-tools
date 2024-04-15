/**
 * @File   : curse.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 5:50:08 PM
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface GameVersion {
    id: number;
    name: string;
    gameVersionTypeID: number;
    slug: string;
}

export class Curse {
    private base = 'https://wow.curseforge.com/api';
    private agent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0';

    constructor(private curseId: number, private token: string) {}

    async gameVersions() {
        const url = `${this.base}/game/versions`;

        const resp = await fetch(url, {
            headers: {
                'X-Api-Token': this.token,
                'user-agent': this.agent,
            },
        });
        return (await resp.json()) as GameVersion[];
    }

    async getGameVersionIdByName(name: string) {
        for (const item of await this.gameVersions()) {
            if (item.name === name) {
                return item.id;
            }
        }
        return 0;
    }

    async uploadFile(filePath: string, version: string, wowVersion: number, changelog = '') {
        if (!this.curseId) {
            console.error('error curse id');
            return;
        }
        const url = `${this.base}/projects/${this.curseId}/upload-file`;
        const form = new FormData();

        form.append(
            'metadata',
            JSON.stringify({
                changelog: changelog || '',
                changelogType: 'markdown',
                gameVersions: [wowVersion],
                releaseType: 'release',
                displayName: version,
            })
        );
        form.append('file', new File([await fs.readFile(filePath)], path.basename(filePath)));

        const resp = await fetch(url, {
            method: 'POST',
            body: form,
            headers: {
                'X-Api-Token': this.token,
                'user-agent': this.agent,
            },
        });

        if (resp.status !== 200) {
            throw Error('upload file failed');
        }

        const body = (await resp.json()) as any;
        if (!body || !body.id) {
            throw Error('upload file failed');
        }

        console.log('file id ' + body.id);
    }

    async importLocale(lang: string, data: string) {
        const form = new FormData();

        form.append(
            'metadata',
            JSON.stringify({
                language: lang,
                'missing-phrase-handling': 'DeletePhrase',
            })
        );
        form.append('localizations', data);

        const url = `${this.base}/projects/${this.curseId}/localization/import`;

        const resp = await fetch(url, {
            method: 'POST',
            body: form,
            headers: {
                'X-Api-Token': this.token,
                'user-agent': this.agent,
            },
        });

        if (resp.status !== 200) {
            throw Error('upload locale failed');
        }

        const body = (await resp.json()) as any;
        if (!body || !body.message || body.message !== 'Imported Successfully.') {
            throw Error('upload locale failed');
        }
    }

    async exportLocale(lang: string, type = 'TableAdditions') {
        const url = new URL(`${this.base}/projects/${this.curseId}/localization/export`);
        url.searchParams.append('lang', lang);
        url.searchParams.append('export-type', type);
        url.searchParams.append('unlocalized', 'ShowPrimaryAsComment');
        url.searchParams.append('true-if-value-equals-key', 'true');

        try {
            const resp = await fetch(url, {
                headers: {
                    'X-Api-Token': this.token,
                    'user-agent': this.agent,
                },
            });

            if (resp.status !== 200) {
                throw Error('export locale failed');
            }

            return await resp.text();
        } catch {
            console.error(`export locale failed : ${url}`);
        }
        return '';
    }
}

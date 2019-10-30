/**
 * @File   : curse.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 5:50:08 PM
 */

import * as fs from 'fs-extra';
import * as FormData from 'form-data';
import { post } from 'got';

export class Curse {
    private base = 'https://wow.curseforge.com/api';

    constructor(private curseId: number, private token: string) {}

    async uploadFile(file: string, version: string) {
        const url = `${this.base}/projects/${this.curseId}/upload-file`;
        const form = new FormData();

        form.append(
            'metadata',
            JSON.stringify({
                changelog: '',
                gameVersions: [7350],
                releaseType: 'release',
                displayName: version
            })
        );
        form.append('file', fs.createReadStream(file));

        const resp = await post(url, {
            body: form,
            headers: {
                'X-Api-Token': this.token,
                'user-agent': ''
            }
        });

        if (resp.statusCode !== 200 || !resp.body) {
            throw Error('upload file failed');
        }

        const body = JSON.parse(resp.body);
        if (!body || !body.id) {
            throw Error('upload file failed');
        }

        console.log('file id ' + body.id);
    }

    async importLocale(lang: string, data: string) {
        const form = new FormData();

        form.append('metadata', JSON.stringify({ language: lang }));
        form.append('localizations', data);

        const url = `${this.base}/projects/${this.curseId}/localization/import`;

        const resp = await post(url, {
            body: form,
            headers: {
                'X-Api-Token': this.token,
                'user-agent': ''
            }
        });

        if (resp.statusCode !== 200 || !resp.body) {
            throw Error('upload locale failed');
        }

        const body = JSON.parse(resp.body);
        if (!body || !body.message || body.message !== 'Imported Successfully.') {
            throw Error('upload locale failed');
        }
    }
}

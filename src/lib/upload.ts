/**
 * @File   : upload.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 7:06:26 PM
 */

import * as fs from 'fs-extra';
import * as FormData from 'form-data';
import { post } from 'got';
import { Project } from './project';

export class Upload {
    private project: Project;

    constructor(project: Project) {
        this.project = project;
    }

    async run() {
        const form = new FormData();

        form.append(
            'metadata',
            JSON.stringify({
                changelog: '',
                gameVersions: [7350],
                releaseType: 'release',
                displayName: this.project.version
            })
        );
        form.append('file', fs.createReadStream(`${this.project.name}-${this.project.version}.zip`));

        try {
            const resp = await post(`https://wow.curseforge.com/api/projects/${this.project.curseId}/upload-file`, {
                body: form,
                headers: {
                    'X-Api-Token': this.project.token,
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
        } catch (error) {
            throw error;
        }
    }
}

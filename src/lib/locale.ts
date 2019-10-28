/**
 * @File   : locale.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/28/2019, 6:16:29 PM
 */

import * as fs from 'fs-extra';
import * as FormData from 'form-data';
import { Project } from './project';
import { post } from 'got';

export class Locale {
    private project: Project;
    private locales = new Map<string, string>();

    constructor(project: Project) {
        this.project = project;
    }

    static async create(project: Project) {
        const obj = new Locale(project);
        await obj.init();
        return obj;
    }

    async init() {
        for (const [locale, file] of this.project.localizations) {
            const content = await this.readLocale(file);
            if (content) {
                this.locales.set(locale, content);
            }
        }
    }

    async readLocale(file: string) {
        const content = await fs.readFile(file, { encoding: 'utf-8' });
        const m = content.match(/\-\-\s*@import@((.|\r\n)+)\-\-\s*@end-import@/);

        if (m) {
            return m[1];
        }
        return undefined;
    }

    async run() {
        for (const [locale, content] of this.locales) {
            const form = new FormData();

            form.append('metadata', JSON.stringify({ language: locale }));
            form.append('localizations', content);

            try {
                const resp = await post(
                    `https://wow.curseforge.com/api/projects/${this.project.curseId}/localization/import`,
                    {
                        body: form,
                        headers: {
                            'X-Api-Token': this.project.token,
                            'user-agent': ''
                        }
                    }
                );

                if (resp.statusCode !== 200 || !resp.body) {
                    throw Error('upload locale failed');
                }

                const body = JSON.parse(resp.body);
                if (!body || !body.message || body.message !== 'Imported Successfully.') {
                    throw Error('upload locale failed');
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
}

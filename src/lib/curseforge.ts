/**
 * @File   : curseforge.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/18/2024, 1:34:44 PM
 */

import { readConfigSync } from './util';

export interface CurseFile {
    id: number;
    fileName: string;
    releaseType: number;
    fileStatus: number;
    downloadUrl: string;
    fileFingerprint: number;
    hashes: { value: string; algo: number }[];
}

export interface Mod {
    id: number;
    name: string;
}

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0';

export class CurseForge {
    private base = 'https://api.curseforge.com/v1/mods';
    private curseId: number;
    private token: string;

    constructor(token?: string) {
        if (!token) {
            token = process.env.CURSE_FORGE_TOKEN;
        }
        if (!token) {
            token = readConfigSync('curse-forge-token');
        }
        if (!token) {
            throw Error('CURSE_FORGE_TOKEN not found');
        }

        this.token = token;
    }

    setCurseId(curseId: number) {
        this.curseId = curseId;
    }

    async files(): Promise<CurseFile[]> {
        const resp = await fetch(`${this.base}/${this.curseId}/files`, {
            headers: {
                'X-Api-Key': this.token,
                'user-agent': USER_AGENT,
            },
        });
        const json = await resp.json();
        return json.data || [];
    }

    async search(name: string) {
        {
            let page = 0;
            while (true) {
                const index = page * 50;
                const url = new URL(`${this.base}/search`);
                url.searchParams.append('gameId', '1');
                url.searchParams.append('searchFilter', name);
                url.searchParams.append('pageSize', '50');
                url.searchParams.append('index', index.toString());

                const resp = await (
                    await fetch(url, {
                        headers: {
                            'X-Api-Key': this.token,
                            'user-agent': USER_AGENT,
                        },
                    })
                ).json();
                const mod = (resp.data || []).find((x: any) => x.name === name);
                if (mod) {
                    console.log(`Found ${name}, id: ${mod.id}`);
                    this.curseId = mod.id;
                    return mod.id;
                }

                if (index + resp.pagination.resultCount >= resp.pagination.totalCount) {
                    console.log(`Not found ${name}`);
                    break;
                }
                page++;
            }
        }

        // {
        //     const p = name.toLowerCase().replace(/\./g, '-');
        //     const url = `https://www.curseforge.com/wow/addons/${p}`;

        //     const resp = await (await fetch(url, { headers: { 'user-agent': USER_AGENT } })).text();

        //     const m = resp.match(/id="__NEXT_DATA__"[^>]+\>(?<code>.+)\<\/script>/ms);
        //     if (m && m.groups) {

        //     }
        // }

        throw Error('not found');
    }
}

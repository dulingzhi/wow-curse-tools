/**
 * @File   : curseforge.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/18/2024, 1:34:44 PM
 */

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
        const url = new URL(`${this.base}/search`);
        url.searchParams.append('gameId', '1');
        url.searchParams.append('searchFilter', name);

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
        throw Error('not found');
    }
}

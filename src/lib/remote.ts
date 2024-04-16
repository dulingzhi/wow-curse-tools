/**
 * @File   : remote.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/15/2024, 6:16:48 PM
 */

import * as os from 'os';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yauzl from 'yauzl';
import { CurseForge } from './curse';
import { Octokit } from '@octokit/rest';

interface Zip {
    zip: yauzl.ZipFile;
    entries: yauzl.Entry[];
}

class RemoteManager {
    private remoteFiles = new Map<string, Zip>();
    private file = 'libs.json';
    private hashes = new Map<string, string>();
    private curseIds = new Map<string, number>();
    private throttled = false;
    private fetched = new Set<string>();

    constructor() {
        if (fs.pathExistsSync(this.file)) {
            const cfg = fs.readJsonSync(this.file);
            this.hashes = new Map(Object.entries(cfg.hashes));
            this.curseIds = new Map(Object.entries(cfg.curseIds));
            this.throttled = Date.now() - cfg.timestamp < 60 * 60 * 1000;
        }
    }

    async getFile(remote: string, file: string): Promise<Buffer | undefined> {
        const zip = await this.getZipFile(remote);
        if (!zip) {
            return;
        }

        file = path.normalize(file);

        let entry = zip.entries.find((x) => x.fileName.endsWith(file));
        if (!entry) {
            entry = zip.entries.find((x) => x.fileName.endsWith(path.basename(file)));
        }
        if (!entry) {
            console.log(`Not found file: ${file}`);
            return;
        }

        return await new Promise(async (resolve, reject) => {
            zip.zip.openReadStream(entry, (e, s) => {
                if (e) {
                    console.log(`read file failed ${file}`);
                    reject(e);
                    return;
                }
                const buffer: any[] = [];
                s.on('data', (data) => buffer.push(data));
                s.on('end', () => resolve(Buffer.concat(buffer)));
            });
        });
    }

    private async getRemoteInfo(remote: string) {
        const [type, name, ref] = remote.split('@');
        if (type === 'curse') {
            const curseId = this.curseIds.get(remote);
            const cli = new CurseForge(curseId);

            if (!curseId) {
                const id = await cli.search(name);
                this.curseIds.set(remote, id);
                this.saveCache();
            }

            const files = await cli.files();
            const file = files.find((x) => x.fileStatus === 4 && x.releaseType === 1);
            if (!file) {
                throw new Error('No release file');
            }

            return [
                file.downloadUrl,
                file.hashes.find((x) => x.algo === 2)?.value || file.fileFingerprint.toString(16),
            ];
        } else if (type === 'github') {
            const o = new Octokit();
            const [owner, repo] = name.split('/');
            if (ref === '[releases]') {
                try {
                    const d = await o.repos.getLatestRelease({ owner, repo });
                    if (d) {
                        const asset = d.data.assets.find((x) => x.name.endsWith('.zip'));
                        if (asset) {
                            return [asset.browser_download_url, d.data.target_commitish];
                        }
                    }
                } catch {}
            } else if (ref === '[tags]') {
                try {
                    const d = await o.repos.listTags({ owner, repo });
                    if (d) {
                        const tag = d.data[0];
                        if (tag) {
                            return [tag.zipball_url, tag.commit.sha];
                        }
                    }
                } catch {}
            } else {
                try {
                    const d = await o.repos.getReleaseByTag({ owner, repo, tag: ref });
                    if (d) {
                        const asset = d.data.assets.find((x) => x.name.endsWith('.zip'));
                        if (asset) {
                            return [asset.browser_download_url, d.data.target_commitish];
                        }
                    }
                } catch {}
                try {
                    const d = await o.repos.listTags({ owner, repo });
                    const tag = d.data.find((x) => x.name === ref);
                    if (tag) {
                        return [tag.zipball_url, tag.commit.sha];
                    }
                } catch {}
                try {
                    const d = await o.repos.getBranch({ owner, repo, branch: ref });
                    if (d) {
                        return [`https://github.com/${owner}/${repo}/archive/refs/heads/${ref}.zip`, d.data.commit.sha];
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }
        return [undefined, undefined];
    }

    private async getZipFile(remote: string) {
        if (this.throttled) {
            return;
        }
        if (!this.remoteFiles.has(remote) && !this.fetched.has(remote)) {
            const [url, hash] = await this.getRemoteInfo(remote);

            if (!url) {
                console.log(`not found ${remote}`);
            }

            if (url && hash && this.hashes.get(remote) !== hash) {
                this.fetched.add(remote);

                try {
                    console.log(`Download (${url}), hash: (${hash})`);

                    const entries: yauzl.Entry[] = [];
                    let buffer: ArrayBuffer;
                    try {
                        const resp = await fetch(url);
                        buffer = await resp.arrayBuffer();
                    } catch (e) {
                        console.log(e);
                    }
                    const zip: yauzl.ZipFile = await new Promise((resolve, reject) => {
                        yauzl.fromBuffer(Buffer.from(buffer), { lazyEntries: true }, (err, zip) => {
                            if (err) {
                                reject(err);
                            }
                            zip.on('entry', (entry) => {
                                console.log(`  -> Found Entry: (${entry.fileName})`);
                                entries.push(entry);
                                zip.readEntry();
                            });
                            zip.on('end', () => {
                                resolve(zip);
                            });
                            zip.readEntry();
                        });
                    });

                    console.log(`Download ok`);

                    this.hashes.set(remote, hash);
                    this.remoteFiles.set(remote, { zip, entries });
                    this.saveCache();
                } catch {}
            } else {
            }
        }
        return this.remoteFiles.get(remote);
    }

    private async saveCache() {
        const d = {
            hashes: Object.fromEntries(this.hashes.entries()),
            curseIds: Object.fromEntries(this.curseIds.entries()),
            timestamp: Date.now(),
        };

        await fs.writeJson(this.file, d, { spaces: 2 });
    }
}

export const gRemote = new RemoteManager();

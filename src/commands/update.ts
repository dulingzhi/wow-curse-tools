/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:25:48 PM
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export class Update {
    private root: string;

    async run(root: string) {
        this.root = path.resolve(root);

        if (!(await fs.pathExists(this.root))) {
            console.error(`Invalid path: ${this.root}`);
            return;
        }

        for (const f of await fs.readdir(this.root)) {
            const p = path.resolve(this.root, f);

            if (/^LibStub|CallbackHandler|Ace/g.test(p) && (await fs.stat(p)).isDirectory()) {
                this.work(p);
            }
        }
    }

    async work(root: string) {
        for (const f of await fs.readdir(root)) {
            const p = path.resolve(root, f);
            const stat = await fs.stat(p);

            if (stat.isDirectory()) {
                this.work(p);
            } else if (stat.isFile()) {
                let rp = path.normalize(path.relative(this.root, p));

                if (os.type() === 'Windows_NT') {
                    rp = rp.replace('\\', '/');
                }

                const url = `https://github.com/WoWUIDev/Ace3/raw/master/${rp}`;

                try {
                    const resp = await fetch(url);
                    if (resp.status === 200) {
                        const body = await resp.text();

                        if (body !== (await fs.readFile(p, 'utf8'))) {
                            fs.writeFile(p, body, 'utf8');
                            console.log(`Update ${p}`);
                        } else {
                            console.log(`Skip ${p}`);
                        }
                    }
                } catch {}
            }
        }
    }
}

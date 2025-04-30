/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 3:30:57 PM
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import { CodeFilesFinder } from './code';
import { ResFilesFinder } from './res';
import { BuildId, gEnv } from '../env';

export interface Remote {
    type: 'curse' | 'github';
    repo: string;
    path: string;
    tag?: string;
}

export interface File {
    path: string;
    relative: string;
    buildId?: BuildId;
}

export async function findFiles(folder: string, name: string, fetchRemote = false, excludePath: string[] = []): Promise<File[]> {
    const filePaths = [
        ...(await new CodeFilesFinder(fetchRemote).findFiles(path.resolve(folder, name + '.toc'))),
        ...(await new ResFilesFinder().findFiles(folder, excludePath)),
    ];

    const tocFiles: File[] = [];
    if (gEnv.env.single) {
        for (const file of filePaths) {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.toc') {
                const ctx = await fs.readFile(file, 'utf8');

                if (ctx.includes(' [AllowLoadGameType ')) {
                    for (const buildId of gEnv.env.builds) {
                        const suffix = gEnv.buildData.get(buildId)!.suffix;
                        tocFiles.push({
                            path: file,
                            relative: path.join(name, path.relative(folder, path.dirname(file)), path.basename(file, ext) + `-${suffix}` + ext),
                            buildId,
                        })
                    }

                    filePaths.splice(filePaths.indexOf(file), 1);
                }
            }
        }
    }

    const files: File[] = filePaths.map((filePath) => ({
        path: filePath,
        relative: path.join(name, path.relative(folder, filePath)),
    }));

    return [...tocFiles, ...files];
}

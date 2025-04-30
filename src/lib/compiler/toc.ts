/**
 * @File   : toc.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:21 PM
 */

import { BuildId, gEnv } from '../env';
import { Compiler } from './compiler';

export class TocCompiler implements Compiler {
    compile(code: string, buildId?: BuildId) {
        const env = gEnv.env;
        const version = env.version.split('-')[0];
        let sb = [];

        let inDebug = false;

        for (const line of code.split(/\r\n|\r|\n/g)) {
            if (!env.debug) {
                if (line.trim() === '#@debug@') {
                    inDebug = true;
                    continue;
                } else if (line.trim() === '#@end-debug@') {
                    inDebug = false;
                    continue;
                } else if (inDebug) {
                    continue;
                }
            }
            if (!inDebug) {
                sb.push(line);
            }
        }

        let projectInterface;
        if (buildId !== undefined) {
            const buildData = gEnv.buildData.get(buildId)!;
            const buildType = buildData.suffix.toLowerCase();

            projectInterface = gEnv.env.buildInfos.get(buildId)!.interface;

            sb = sb.filter(line => {
                const m = line.match(/\s+\[AllowLoadGameType\s+(.+)\]/)
                if (!m) {
                    return true;
                }

                const types = new Set(m[1].split(',').map(v => v.toLowerCase().trim()));
                return types.has(buildType);
            }).map(line => line.replace(/\s+\[AllowLoadGameType\s+(.+)\]/g, '').trim());
        } else {
            projectInterface = [...gEnv.env.buildInfos.values()].sort().map(v => v.interface).join(', ');
        }

        code = sb.join('\n');

        return code
            .replace(/#@project-version@/g, `## Version: ${version}`)
            .replace(/#@project-interface@/g, `## Interface: ${projectInterface}`)
            .replace(/@project-version@/g, version)
            .replace(/@project-interface@/g, projectInterface);
    }
}

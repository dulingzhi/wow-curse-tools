/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/17/2021, 2:57:51 PM
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { gEnv } from '../env';

export function isNeedRemoveNode(node: Element) {
    const builds = node
        .getAttribute('build')
        ?.split(',')
        .filter((x) => x !== '');

    if (!builds || builds.length === 0) {
        return false;
    }

    const not = builds.filter((x) => x.startsWith('!')).map((x) => x.substr(1));
    if (not.length > 0) {
        if (not.length > 1 || not.length !== builds.length) {
            throw Error('xml build error');
        }
        return gEnv.env.buildId === not[0];
    }

    const or = builds.filter((x) => !x.startsWith('!'));
    if (or.length === 0) {
        throw Error('bang');
    }

    if (or.includes(gEnv.env.buildId)) {
        return false;
    }
    return true;
}

export function isListFile(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.xml' || ext === '.toc';
}

export async function readFile(filePath: string) {
    return (await fs.readFile(filePath, { encoding: 'utf-8' })).replace(/^\uFEFF/g, '');
}

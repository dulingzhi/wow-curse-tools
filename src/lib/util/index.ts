/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/17/2021, 2:57:51 PM
 */

import os = require('os');
import path = require('path');
import fs = require('fs-extra');
import { gEnv } from '../env';

export function isRemoveCondition(text: string) {
    {
        const m = text.trim().match(/^([><=!~^]+)(\d+)$/);
        if (m) {
            return !gEnv.checkBuild(m[1], m[2]);
        }
    }

    {
        const m = text.trim().match(/^(non-)?(.+)$/);
        if (m) {
            const ok = gEnv.checkCondition(m[2]);
            return m[1] === 'non-' ? ok : !ok;
        }
    }

    return false;
}

export function isNeedRemoveNode(node: Element) {
    const build = node.getAttribute('build');
    return build ? isRemoveCondition(build) : false;
}

export function isListFile(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.xml' || ext === '.toc';
}

export async function readFile(filePath: string) {
    return (await fs.readFile(filePath, { encoding: 'utf-8' })).replace(/^\uFEFF/g, '');
}

export async function writeFile(filePath: string, data: string) {
    if ((await fs.pathExists(filePath)) && (await readFile(filePath)) === data) {
        return false;
    }
    await fs.writeFile(filePath, data);
    return true;
}

export async function copyFile(filePath: string, targetPath: string) {
    if (
        (await fs.pathExists(filePath)) &&
        (await fs.pathExists(targetPath)) &&
        Buffer.compare(await fs.readFile(targetPath), await fs.readFile(filePath)) === 0
    ) {
        return false;
    }
    await fs.copyFile(filePath, targetPath);
    return true;
}

export async function readChangeLog(file: string, version: string) {
    if (!(await fs.pathExists(file))) {
        return;
    }

    const data = await readFile(file);
    const lines: string[] = [];

    for (const [line] of data.matchAll(/[^\r\n]+/g)) {
        const m = line.match(/^## \[(\d+\.\d+\.\d+)\]/);
        if (m) {
            if (m[1] !== version) {
                break;
            }
        } else {
            lines.push(line);
        }
    }
    return lines.join('\n');
}

export function toWowVersion(t: string) {
    const m = t.match(/^(\d*)(\d\d)(\d\d)$/);
    if (m) {
        return `${Number.parseInt(m[1])}.${Number.parseInt(m[2])}.${Number.parseInt(m[3])}`;
    }
    return '';
}

export function toInterfaceVersion(t: string) {
    const m = t.match(/^(\d+)\.(\d+)\.(\d+)\./);
    if (m) {
        return `${m[1]}${m[2].padStart(2, '0')}${m[3].padStart(2, '0')}`;
    }
    return '';
}

export function readConfigSync(...paths: string[]) {
    const cfg = fs.readJsonSync(`${os.homedir()}/.wct.json`);
    let current = cfg;
    for (const [i, p] of paths.entries()) {
        if (current[p] && i + 1 < paths.length) {
            current = current[p];
        } else {
            return current[p];
        }
    }

    if (paths.length === 1) {
        const key = paths[0].toUpperCase().replace(/-/g, '_');
        return process.env[key];
    }
}

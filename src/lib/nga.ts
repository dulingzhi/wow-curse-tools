/**
 * @File   : nga.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 3/6/2025, 1:15:21 PM
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as iconv from 'iconv-lite';
import { convertChangelogToBBCode, readConfigSync } from './util';
import decode from 'html-entities-decode';
import { DateTime } from 'luxon'

export class Nga {
    private cookie: string;
    private fid: number;
    private content: string;
    private subject: string;
    private auth: string;
    private attach_url: string;
    private attachments: string;
    private attachments_check: string;
    private attachments_name: string;

    constructor(private tid: number, cookie?: string) {
        if (!cookie) {
            cookie = readConfigSync('nga-cookie')
        }
        if (!cookie) {
            throw Error('Not found NGA_COOKIE')
        }
        this.cookie = cookie
    }

    async decodeResponse(resp: Response) {
        const arrayBuffer = await resp.arrayBuffer();
        const text = new TextDecoder('gbk').decode(arrayBuffer)
        const d = text.substring(text.indexOf('=') + 1)

        try {
            return JSON.parse(d);
        }
        catch {
            return eval(d)
        }
    }

    async uploadFile(file: string) {
        const form = new FormData()
        form.append('v2', '1')
        form.append('func', 'upload')
        form.append('fid', this.fid.toString())
        form.append('auth', this.auth)
        form.append('attachment_file1', new File([await fs.readFile(file)], path.basename(file)))
        form.append('attachment_file1_dscp', '');
        form.append('attachment_file1_url_utf8_name', file)
        form.append('__output', '11')

        const resp = await fetch(this.attach_url, {
            method: 'POST',
            headers: { 'Cookie': this.cookie, },
            body: form,
        })

        const r = await this.decodeResponse(resp)

        this.attachments = r.attachments
        this.attachments_check = r.attachments_check
        this.attachments_name = r.url
    }

    async fetchThread() {
        const resp = await fetch(`https://bbs.nga.cn/post.php?action=modify&tid=${this.tid}&lite=js`, {
            headers: { Cookie: this.cookie }
        })
        const r = await this.decodeResponse(resp)

        this.fid = r.data.fid
        this.content = decode(r.data.content)
        this.subject = decode(r.data.subject)
        this.auth = r.data.auth
        this.attach_url = r.data.attach_url
    }

    encodeGBK(text: string) {
        return [...iconv.encode(text, 'gbk')].map(x => x < 0x80 ? encodeURIComponent(String.fromCharCode(x)) : '%' + x.toString(16).padStart(2, '0').toUpperCase()).join('')
    }

    async publishThread(subject: string, content: string) {
        const form = new URLSearchParams();
        form.append('action', 'modify');
        form.append('tid', this.tid.toString());
        form.append('fid', this.fid.toString());
        form.append('lite', 'js');
        form.append('step', '2');
        // form.append('post_subject', this.encodeGBK(subject));
        // form.append('post_content', this.encodeGBK(content));
        form.append('attachments', this.attachments);
        form.append('attachments_check', this.attachments_check);

        const f = form.toString() + `&post_subject=${this.encodeGBK(subject)}&post_content=${this.encodeGBK(content)}`;

        const resp = await fetch(`https://bbs.nga.cn/post.php`, {
            method: 'POST',
            headers: { Cookie: this.cookie, ['Content-Type']: 'application/x-www-form-urlencoded' },
            body: f,
        })

        const r = await this.decodeResponse(resp)
        console.log(r)
    }

    async replyThread(version: string) {
        const form = new URLSearchParams();
        form.append('action', 'reply');
        form.append('tid', this.tid.toString());
        form.append('fid', this.fid.toString());
        form.append('lite', 'js');
        form.append('step', '2');

        const f = form.toString() + `&post_content=${this.encodeGBK(`Update to ${version}`)}`;

        const resp = await fetch(`https://bbs.nga.cn/post.php`, {
            method: 'POST',
            headers: { Cookie: this.cookie, ['Content-Type']: 'application/x-www-form-urlencoded' },
            body: f,
        })

        const r = await this.decodeResponse(resp)
        console.log(r)
    }

    async run(file: string, version: string) {
        await this.fetchThread()
        await this.uploadFile(file)

        const changelogFile = path.resolve('CHANGELOG.md');
        const date = DateTime.now().setZone('Asia/Shanghai').toFormat('yyyy-MM-dd')
        const subject = this.subject.replace(/\d+\.\d+\.\d+/g, version).replace(/\d\d\d\d\-\d{1,2}\-\d{1,2}/g, date);

        let ctx = this.content;
        ctx = ctx.replace(/\[url=([^\[]+)\]NGA下载\[\/url\]/g, `[url=https://img.nga.178.com/attachments/${this.attachments_name}?filename=${file}]NGA下载[/url]`);

        if (await fs.pathExists(changelogFile)) {
            const bbcode = convertChangelogToBBCode(await fs.readFile(changelogFile, { encoding: 'utf-8' }))
            ctx = ctx.replace(/\[collapse=changlog\](.+)\[\/collapse\]/g, `[collapse=changlog]${bbcode}[/collapse]`);
        }

        await this.publishThread(subject, ctx)
        await this.sleep(20 * 1000)
        await this.replyThread(version)
    }

    sleep(ms: number) {
        return new Promise((resolve) => setTimeout(() => resolve(true), ms));
    }
}

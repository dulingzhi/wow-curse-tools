/**
 * @File   : xml.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/8/2021, 1:14:56 PM
 */

import { DOMParser, XMLSerializer } from 'xmldom';
import { Compiler, gCompilerManager } from './compiler';

export class XmlCompiler implements Compiler {
    compile(code: string) {
        const doc = new DOMParser().parseFromString(code);

        this.processNodes(doc.childNodes);

        return new XMLSerializer().serializeToString(doc);
    }

    isNeedRemoveNode(node: Element) {
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
            return gCompilerManager.env.buildId === not[0];
        }

        const or = builds.filter((x) => !x.startsWith('!'));
        if (or.length === 0) {
            throw Error('bang');
        }

        if (or.includes(gCompilerManager.env.buildId)) {
            return false;
        }
        return true;
    }

    processNodes(nodes: NodeListOf<ChildNode>) {
        if (!nodes) {
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes.item(i);

            if (node.nodeType === 1) {
                const e = node as Element;
                if (this.isNeedRemoveNode(e)) {
                    node.parentNode?.removeChild(node);
                } else {
                    e.removeAttribute('build');
                    this.processNodes(node.childNodes);
                }
            }
        }
    }
}

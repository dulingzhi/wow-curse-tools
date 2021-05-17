/**
 * @File   : xml.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/8/2021, 1:14:56 PM
 */

import { DOMParser, XMLSerializer } from 'xmldom';
import { Compiler } from './compiler';

import { isNeedRemoveNode } from '../util';

export class XmlCompiler implements Compiler {
    compile(code: string) {
        const doc = new DOMParser().parseFromString(code);

        this.processNodes(doc.childNodes);

        return new XMLSerializer().serializeToString(doc);
    }

    processNodes(nodes: NodeListOf<ChildNode>) {
        if (!nodes) {
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes.item(i);

            if (node.nodeType === 1) {
                const e = node as Element;
                if (isNeedRemoveNode(e)) {
                    node.parentNode?.removeChild(node);
                } else {
                    e.removeAttribute('build');
                    this.processNodes(node.childNodes);
                }
            }
        }
    }
}

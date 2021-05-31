/**
 * @File   : xml.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/8/2021, 1:14:56 PM
 */

import { DOMParser, XMLSerializer } from 'xmldom';
import { Compiler } from './compiler';

import { isNeedRemoveNode, isRemoveCondition } from '../util';

export class XmlCompiler implements Compiler {
    compile(code: string) {
        const doc = new DOMParser().parseFromString(code);

        this.processNodes(doc.childNodes);

        return new XMLSerializer().serializeToString(doc);
    }

    processAttributes(node: Element) {
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes.item(i);
            if (attr) {
                const m = attr.name.match(/^build:(.+)/);
                if (m) {
                    const name = m[1];
                    const m2 = attr.nodeValue?.match(/^@(.+)@(.+)$/);
                    if (m2) {
                        const condition = m2[1];
                        const body = m2[2];

                        if (!isRemoveCondition(condition)) {
                            node.setAttribute(name, body);
                        }
                    }

                    node.removeAttributeNode(attr);
                }
            }
        }
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
                    this.processAttributes(e);

                    e.removeAttribute('build');
                    this.processNodes(node.childNodes);
                }
            }
        }
    }
}

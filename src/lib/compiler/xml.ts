/**
 * @File   : xml.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 5/8/2021, 1:14:56 PM
 */

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { Compiler } from './compiler';

import { isNeedRemoveNode } from '../util';
import { gEnv } from '../env';

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
                if (m && attr.nodeValue) {
                    const name = m[1];
                    const reg = /(non-)?([^()\- ]+)\(([^() ]+)\)/g;

                    for (const [, non, buildId, content] of attr.nodeValue.matchAll(reg)) {
                        if ((!non && gEnv.checkCondition(buildId)) || (non && !gEnv.checkCondition(buildId))) {
                            node.setAttribute(name, content);
                            break;
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

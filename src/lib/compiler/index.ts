/**
 * @File   : index.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 10/29/2019, 4:00:16 PM
 */

import { gCompilerManager } from './compiler';
import { TocCompiler } from './toc';
import { LuaCompiler } from './lua';

gCompilerManager.register('.toc', new TocCompiler());
gCompilerManager.register('.lua', new LuaCompiler());

export function compileFile(file: string) {
    return gCompilerManager.compile(file);
}

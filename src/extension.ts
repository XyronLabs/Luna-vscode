import { ExtensionContext } from 'vscode';

import LunaProject from './LunaProject';

let luna: LunaProject;

export function activate(context: ExtensionContext) {
    luna = new LunaProject(context);
}

export function deactivate() {
    luna.dispose();
}
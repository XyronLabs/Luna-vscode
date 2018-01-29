import { commands, window, workspace, ExtensionContext, Uri } from 'vscode';
import * as request from 'request';
import * as fs from 'fs';

import LunaProject from './LunaProject';

let luna: LunaProject;

export function activate(context: ExtensionContext) {
    luna = new LunaProject(context);
}

export function deactivate() {
    luna.dispose();
}
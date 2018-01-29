import { commands, window, workspace, ExtensionContext, Uri } from 'vscode';
import * as request from 'request';
import * as fs from 'fs';

import LunaProject from './LunaProject';

let luna: LunaProject;

export function activate(context: ExtensionContext) {
    luna = new LunaProject(context);

    // TEST
    let install_extension = commands.registerCommand('luna.install.extension', () => {
        window.showInputBox().then(packageName => {
            // new ExtensionHandler().installExtension(packageName);
        })
    });
    context.subscriptions.push(install_extension);
}

export function deactivate() {
    luna.dispose();
}
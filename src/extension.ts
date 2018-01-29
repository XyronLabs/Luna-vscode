import { commands, window, workspace, ExtensionContext, Uri } from 'vscode';
import * as request from 'request';
import * as fs from 'fs';

import LunaProject from './LunaProject';

let luna: LunaProject;

export function activate(context: ExtensionContext) {
    luna = new LunaProject();

    let luna_run_current    = commands.registerCommand('luna.run.current', () => luna.launch(window.activeTextEditor.document.fileName));
    let luna_run_main       = commands.registerCommand('luna.run.main',    () => luna.launch(workspace.rootPath + "/main.luna"));
    let luna_create_project = commands.registerCommand('luna.initproject', () => luna.newProject());
    let luna_update         = commands.registerCommand('luna.update',      () => luna.checkForUpdates());
    let luna_force_update   = commands.registerCommand('luna.forceupdate', () => luna.checkForUpdates(true));
    let luna_open_wiki      = commands.registerCommand('luna.open.wiki',   () => commands.executeCommand('vscode.open', Uri.parse("https://github.com/XyronLabs/Luna/wiki")));
    let luna_open_output    = commands.registerCommand('luna.open.output', () => luna.outputChannel.show());

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);
    context.subscriptions.push(luna_create_project);
    context.subscriptions.push(luna_update);
    context.subscriptions.push(luna_force_update);
    context.subscriptions.push(luna_open_wiki);
    context.subscriptions.push(luna_open_output);


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
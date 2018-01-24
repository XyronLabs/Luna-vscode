'use strict';

import { commands, window, ExtensionContext, Uri } from 'vscode';
import { LunaProject } from './LunaProject';

let luna: LunaProject;

export function activate(context: ExtensionContext) {

    luna = new LunaProject();

    let luna_run_current    = commands.registerCommand('luna.run.current', () => luna.launch(window.activeTextEditor.document.fileName) );
    let luna_run_main       = commands.registerCommand('luna.run.main', () => luna.launch() );
    let luna_create_project = commands.registerCommand('luna.initproject', () => luna.newProject() );
    let luna_update         = commands.registerCommand('luna.update', () =>luna.checkForUpdates() );
    let luna_force_update   = commands.registerCommand('luna.forceupdate', () => luna.checkForUpdates(true) );
    let luna_open_wiki      = commands.registerCommand('luna.openwiki', () => commands.executeCommand('vscode.open', Uri.parse("https://github.com/XyronLabs/Luna/wiki")) );
    let luna_open_output    = commands.registerCommand('luna.openoutput', () => luna.outputChannel.show() );

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);
    context.subscriptions.push(luna_create_project);
    context.subscriptions.push(luna_update);
    context.subscriptions.push(luna_force_update);
    context.subscriptions.push(luna_open_wiki);
    context.subscriptions.push(luna_open_output);
}

// this method is called when your extension is deactivated
export function deactivate() {
    luna.dispose();
}
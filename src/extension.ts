'use strict';

import * as vscode from 'vscode';
import { LunaProject } from './LunaProject';

let luna: LunaProject;

let automaticHideOutput: vscode.WorkspaceConfiguration;

export function activate(context: vscode.ExtensionContext) {

    luna = new LunaProject();

    automaticHideOutput = vscode.workspace.getConfiguration('luna').get("autoHideOutput");
    
    if (vscode.workspace.getConfiguration('luna').get('isLunaProject')) {
        luna.checkForUpdates()
    }

    let luna_run_current = vscode.commands.registerCommand('luna.run.current', () => {
        luna.launch(vscode.window.activeTextEditor.document.fileName);
    });

    let luna_run_main = vscode.commands.registerCommand('luna.run.main', () => {
        luna.launch();
    });

    let luna_create_project = vscode.commands.registerCommand('luna.initproject', () => {
        luna.newProject();
    });

    let luna_update = vscode.commands.registerCommand('luna.update', () => {
        luna.checkForUpdates();
    })

    let luna_force_update = vscode.commands.registerCommand('luna.forceupdate', () => {
        luna.checkForUpdates(true);
    })

    let luna_open_wiki = vscode.commands.registerCommand('luna.openwiki', () => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("https://github.com/XyronLabs/Luna/wiki"));
    })

    let luna_open_output = vscode.commands.registerCommand('luna.openoutput', () => {
        luna.outputChannel.show();
    })

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);
    context.subscriptions.push(luna_create_project);
    context.subscriptions.push(luna_update);
    context.subscriptions.push(luna_force_update);
    context.subscriptions.push(luna_open_wiki);
}

// this method is called when your extension is deactivated
export function deactivate() {
    luna.dispose();
}
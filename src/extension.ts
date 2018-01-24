'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';
import { LunaProject } from './LunaProject';

let luna: LunaProject;

let luna_version: string,
    luna_output: vscode.OutputChannel,
    luna_terminal: vscode.Terminal,
    run_button: vscode.StatusBarItem,
    openwiki_button: vscode.StatusBarItem,
    open_luna_output: vscode.StatusBarItem;

let term: string,
    args1: any,
    args2: string,
    args3: string;

let automaticHideOutput: vscode.WorkspaceConfiguration;

export function activate(context: vscode.ExtensionContext) {

    luna = new LunaProject();

    automaticHideOutput = vscode.workspace.getConfiguration('luna').get("autoHideOutput");

    // Initialize output channel
    luna_output = vscode.window.createOutputChannel('Luna');
    luna_output.show(true);
    
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
        luna.checkForUpdates(true);

        // Setup Luna settings
        vscode.workspace.getConfiguration('files').update('exclude', {"**/*.dll": true, "**/res": true, "**/luna.exe": true, "**/luna": true, "**/.vscode": true}, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('isLunaProject', true, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('autoHideOutput', true, vscode.ConfigurationTarget.Workspace);

        // Create main.lua and open it
        fs.appendFile(vscode.workspace.rootPath + '/main.luna','');
        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/main.luna').then(doc => {
            vscode.window.showTextDocument(doc);
        });
    });

    let luna_update = vscode.commands.registerCommand('luna.update', () => {
        luna_output.show();
        luna.checkForUpdates();
    })

    let luna_force_update = vscode.commands.registerCommand('luna.forceupdate', () => {
        luna_output.show();
        luna.checkForUpdates(true);
    })

    let luna_open_wiki = vscode.commands.registerCommand('luna.openwiki', () => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("https://github.com/XyronLabs/Luna/wiki"));
    })

    let luna_open_output = vscode.commands.registerCommand('luna.openoutput', () => {
        luna_output.show();
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
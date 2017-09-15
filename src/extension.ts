'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';

let luna_version, luna_output;
let term, args1, args2, argsmain;

export function activate(context: vscode.ExtensionContext) {
    // Initialize output channel
    luna_output = vscode.window.createOutputChannel('Luna');
    
    luna_output.appendLine('Luna is checking for updates, please wait...');
    luna_output.show();

    // Latest Luna release (from Debian control file)
    request.get({url: 'https://raw.githubusercontent.com/XyronLabs/Luna/master/build/debian/control'}, (err, response, body) => {
        let text :String = body;
        luna_version = text.match("[0-9].[0-9](.[0-9])?-[0-9][0-9]([0-9])?")[0];
        checkLunaInstalled();
    });

    if (process.platform === 'win32') {
        term = 'cmd.exe';
        args1 = [ '/Q', '/C', 'luna'];
        args2 = ['&&', 'pause']
        argsmain = [ '/Q', '/C', 'luna', vscode.workspace.rootPath + '/main.luna', '&&', 'pause'];
    } else if (process.platform === 'linux') {
        term = 'bash';
        args1 = [ '-c', 'luna ']
        args2 = ['&&' + 'read'];
        argsmain = [ '-c', 'luna ' + vscode.workspace.rootPath + '/main.luna' + '&&' + 'read'];
    }

    let luna_run_current = vscode.commands.registerCommand('luna.run.current', () => {
        luna_output.appendLine("Launching Luna: " + vscode.window.activeTextEditor.document.fileName);
        let x = vscode.window.createTerminal('Luna terminal', term, [args1 , vscode.window.activeTextEditor.document.fileName, args2]);
        x.show();
    });

    let luna_run_main = vscode.commands.registerCommand('luna.run.main', () => {
        luna_output.appendLine("Launching Luna: " + vscode.workspace.rootPath + '/main.luna');
        let x = vscode.window.createTerminal('Luna terminal', term, argsmain);
        x.show();
    });

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function checkLunaInstalled() {
    let ver = vscode.workspace.getConfiguration('luna').get('version');
    if (!ver || ver < luna_version) {
        installLuna();
    } else {
        luna_output.appendLine('Luna is up to date!');
    }
}

function installLuna() {
    // Install latest Luna version
    luna_output.appendLine("Installing Luna " + luna_version + " to this folder: " + vscode.workspace.rootPath);
    request.get({url: 'https://github.com/XyronLabs/Luna/releases/download/' + luna_version + '/luna-' + luna_version + '_standalone_' + process.platform + '.zip', encoding: null}, (err, response, body) => {
        fs.writeFileSync(vscode.workspace.rootPath + "/luna.zip", body, 'binary');

        extract_zip(vscode.workspace.rootPath + "/luna.zip", {dir: vscode.workspace.rootPath}, (err) => {
            if (err) vscode.window.showErrorMessage(err);
            fs.unlinkSync(vscode.workspace.rootPath + "/luna.zip");
            luna_output.appendLine("Luna was successfully updated!");
        });
    });

    // Hide Luna files
    vscode.workspace.getConfiguration('files').update('exclude', {"**/*.dll": true, "**/res": true, "**/luna.exe": true, "**/.vscode": true}, vscode.ConfigurationTarget.Workspace);
    vscode.workspace.getConfiguration('luna').update('version', luna_version, vscode.ConfigurationTarget.Workspace);
}
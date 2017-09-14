'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';

let luna_version = '0.7.1-13' // TODO: Check from remote
let term, args1, args2, argsmain;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    vscode.window.showInformationMessage('Luna is checking for updates, please wait...');
    checkLunaInstalled();

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
        vscode.window.showInformationMessage("Launching Luna: " + vscode.window.activeTextEditor.document.fileName);
        let x = vscode.window.createTerminal('Luna terminal', term, [args1 , vscode.window.activeTextEditor.document.fileName, args2]);
        x.show();
    });

    let luna_run_main = vscode.commands.registerCommand('luna.run.main', () => {
        vscode.window.showInformationMessage("Launching Luna: " + vscode.workspace.rootPath + '/main.luna');
        let x = vscode.window.createTerminal('Luna terminal', term, argsmain);
        x.show();
    });

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);

    if (process.platform === 'win32') {
        context.subscriptions.push(vscode.commands.registerCommand('luna.download', () => {
            installLuna();
        }));
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function checkLunaInstalled() {
    if (!vscode.workspace.getConfiguration('luna').get('version')) {
        installLuna();
    } else {
        vscode.window.showInformationMessage('Luna is up to date!');
    }
}

function installLuna() {
    // Install latest Luna version
    vscode.window.showInformationMessage("Installing Luna " + luna_version + " to this folder: " + vscode.workspace.rootPath);
    request.get({url: 'https://github.com/XyronLabs/Luna/releases/download/' + luna_version + '/luna-' + luna_version + '_standalone_' + process.platform + '.zip', encoding: null}, (err, response, body) => {
        fs.writeFileSync(vscode.workspace.rootPath + "/luna.zip", body, 'binary');

        extract_zip(vscode.workspace.rootPath + "/luna.zip", {dir: vscode.workspace.rootPath}, (err) => {
            if (err) vscode.window.showErrorMessage(err);
            fs.unlinkSync(vscode.workspace.rootPath + "/luna.zip");
            vscode.window.showInformationMessage("Luna was successfully updated!");
        });
    });

    // Hide Luna files
    vscode.workspace.getConfiguration('files').update('exclude', {"**/*.dll": true, "**/res": true, "**/luna.exe": true, "**/.vscode": true}, vscode.ConfigurationTarget.Workspace);
    vscode.workspace.getConfiguration('luna').update('version', luna_version, vscode.ConfigurationTarget.Workspace);
}
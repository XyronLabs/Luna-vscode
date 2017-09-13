'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Luna-vscode extension is now active!');

    let term, args, argsmain;
    let myExtDir = vscode.extensions.getExtension("ACharLuk.luna-vscode").extensionPath;

    if (process.platform === 'win32') {
        term = 'cmd.exe';
        args = [ '/Q', '/C', 'luna', vscode.window.activeTextEditor.document.fileName, '&&', 'pause' ];
        argsmain = [ '/Q', '/C', 'luna', vscode.workspace.rootPath + '/main.luna', '&&', 'pause'];
    } else if (process.platform === 'linux') {
        term = 'bash';
        args = [ '-c', 'luna ' + vscode.window.activeTextEditor.document.fileName + '&&' + 'read'];
        argsmain = [ '-c', 'luna ' + vscode.workspace.rootPath + '/main.luna' + '&&' + 'read'];
    }

    let luna_run_current = vscode.commands.registerCommand('luna.run.current', () => {
        vscode.window.showInformationMessage("Launching Luna: " + vscode.window.activeTextEditor.document.fileName);
        let x = vscode.window.createTerminal('Luna terminal', term, args);
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
            vscode.window.showInformationMessage("Installing Luna to this folder: " + vscode.workspace.rootPath);
            request.get({url: 'https://github.com/XyronLabs/Luna/releases/download/0.7-12/luna-0.7-12_windows.zip', encoding: null}, (err, response, body) => {
                fs.writeFileSync(vscode.workspace.rootPath + "/luna.zip", body, 'binary');

                extract_zip(vscode.workspace.rootPath + "/luna.zip", {dir: vscode.workspace.rootPath}, (err) => {
                    if (err) vscode.window.showErrorMessage(err);
                    fs.unlinkSync(vscode.workspace.rootPath + "/luna.zip");
                    vscode.window.showInformationMessage("Luna was successfully installed!");
                });
            });
        }));
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
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

    if (process.platform === 'win32') {
        term = 'cmd.exe';
        args = [ '/Q', '/C', '.luna_bin\\luna', vscode.window.activeTextEditor.document.fileName, '&&', 'pause' ];
        argsmain = [ '/Q', '/C', '.luna_bin\\luna', vscode.workspace.rootPath + '/main.luna', '&&', 'pause'];
    } else if (process.platform === 'linux') {
        term = 'bash';
        args = [ '-c', 'luna ' + vscode.window.activeTextEditor.document.fileName + '&&' + 'read'];
        argsmain = [ '-c', 'luna ' + vscode.workspace.rootPath + '/main.luna' + '&&' + 'read'];
    }

    let luna_run_current = vscode.commands.registerCommand('luna.run.current', () => {
        let x = vscode.window.createTerminal('Luna terminal', term, args);
        x.show();
    });

    let luna_run_main = vscode.commands.registerCommand('luna.run.main', () => {
        let x = vscode.window.createTerminal('Luna terminal', term, argsmain);
        x.show();
    });

    let luna_download = vscode.commands.registerCommand('luna.download', () => {
        console.log("Platform: " + process.platform);
        vscode.window.showInformationMessage("Downloading latest Luna update for platform " + process.platform);
        // request.get({url: 'https://github.com/XyronLabs/Luna/releases/download/0.7-12/luna-0.7-12_vscode' + process.platform + '.zip', encoding: null}, (err, response, body) => {
        request.get({url: 'https://github.com/XyronLabs/Luna/releases/download/0.7-12/luna-0.7-12_windows.zip', encoding: null}, (err, response, body) => {
            fs.writeFileSync(__dirname + "/luna.zip", body, 'binary');
            
            extract_zip(__dirname + "/luna.zip", {dir: __dirname+'/.luna_bin'}, (err) => {
                if (err) vscode.window.showErrorMessage(err);
                fs.unlinkSync(__dirname + "/luna.zip");
                vscode.window.showInformationMessage("Luna was successfully updated!");
            });
        });
    });

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);
    context.subscriptions.push(luna_download);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
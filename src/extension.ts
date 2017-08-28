'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Luna-vscode extension is now active!');

    let luna_run_current = vscode.commands.registerCommand('luna.run.current', () => {
        let x = vscode.window.createTerminal('Luna terminal', 'cmd.exe',
        [ '/Q', '/C', 'luna', vscode.window.activeTextEditor.document.fileName, '&&', 'pause' ]);
        x.show();
        
    });

    let luna_run_main = vscode.commands.registerCommand('luna.run.main', () => {
        let x = vscode.window.createTerminal('Luna terminal', 'cmd.exe',
        [ '/Q', '/C', 'luna', vscode.workspace.rootPath + '/main.luna', '&&', 'pause']);
        x.show();
        
    });

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
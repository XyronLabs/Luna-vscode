'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';

let luna_version, luna_output, luna_terminal;
let term, args1, args2, argsmain;

export function activate(context: vscode.ExtensionContext) {
    // Initialize output channel
    luna_output = vscode.window.createOutputChannel('Luna');
    luna_output.show(true);
    
    if (vscode.workspace.getConfiguration('luna').get('isLunaProject')) {
        checkLatestLuna();
    }

    if (process.platform === 'win32') {
        term = 'cmd.exe';
        args1 = [ '/Q', '/C', 'luna'];
        args2 = ['&&', 'pause'];
    } else if (process.platform === 'linux') {
        term = 'bash';
        if (vscode.workspace.getConfiguration('luna').get('isLunaProject')) {
            args1 = [ '-c','LD_LIBRARY_PATH=lib ./luna' ];
        } else {
            args1 = [ '-c', 'luna'];
        }
        args2 = ' && read';
    }

    let luna_run_current = vscode.commands.registerCommand('luna.run.current', () => {
        runLunaFile(vscode.window.activeTextEditor.document.fileName);
    });

    let luna_run_main = vscode.commands.registerCommand('luna.run.main', () => {
        runLunaFile(vscode.workspace.rootPath + '/main.luna');
    });

    let luna_create_project = vscode.commands.registerCommand('luna.initproject', () => {
        checkLatestLuna();

        // Hide Luna files
        vscode.workspace.getConfiguration('files').update('exclude', {"**/*.dll": true, "**/res": true, "**/luna.exe": true, "**/.vscode": true}, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('isLunaProject', true, vscode.ConfigurationTarget.Workspace);

        // Create main.lua and open it
        fs.appendFile(vscode.workspace.rootPath + '/main.luna','');
        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/main.luna').then(doc => {
            vscode.window.showTextDocument(doc);
        });
    });

    context.subscriptions.push(luna_run_current);
    context.subscriptions.push(luna_run_main);
    context.subscriptions.push(luna_create_project);
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (luna_output) luna_output.dispose();
    if (luna_terminal) luna_terminal.dispose();
}

function runLunaFile(filePath) {
    vscode.workspace.saveAll();
    luna_output.appendLine("Launching Luna: " + filePath);
    if (luna_terminal) luna_terminal.dispose();
    luna_terminal = vscode.window.createTerminal('Luna terminal', term, args1.concat(filePath, args2));
    luna_terminal.show(true);
}

function checkLatestLuna() {
    luna_output.appendLine('Luna is checking for updates, please wait...');

    // Latest Luna release (from Debian control file)
    request.get({url: 'https://raw.githubusercontent.com/XyronLabs/Luna/master/build/debian/control'}, (err, response, body) => {
        let text :String = body;
        luna_version = text.match("[0-9].[0-9](.[0-9])?-[0-9][0-9]([0-9])?")[0];
        checkLunaInstalled();
    });
}

function checkLunaInstalled() {
    let ver = vscode.workspace.getConfiguration('luna').get('version');
    luna_output.appendLine("Currently installed Luna version: " + ver);
    luna_output.appendLine("Latest Luna version avaliable: " + luna_version);

    if (!ver || ver < luna_version) {
        installLuna();
    } else {
        luna_output.appendLine('Luna is up to date!');
    }
}

function installLuna() {
    // Install latest Luna version
    luna_output.appendLine("Installing Luna " + luna_version + " to this folder: " + vscode.workspace.rootPath);
    request.get({url: 'https://github.com/XyronLabs/Luna/releases/download/' + luna_version + '/luna-' + luna_version + '_standalone_' + process.platform + '.zip', encoding: 'binary'}, (err, response, body) => {
        if (err) {
            vscode.window.showErrorMessage(err);
        } else {
            fs.writeFileSync(vscode.workspace.rootPath + "/luna.zip", body, 'binary');

            extract_zip(vscode.workspace.rootPath + "/luna.zip", {dir: vscode.workspace.rootPath}, (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Could not update Luna to version " + luna_version);
                } else {
                    fs.unlinkSync(vscode.workspace.rootPath + "/luna.zip");
                    luna_output.appendLine("Luna was successfully updated!");
                    vscode.workspace.getConfiguration('luna').update('version', luna_version, vscode.ConfigurationTarget.Workspace);
                }
            });
        }
    });
}
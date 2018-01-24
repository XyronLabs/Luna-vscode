'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';

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
    automaticHideOutput = vscode.workspace.getConfiguration('luna').get("autoHideOutput");
    
    // Run Luna button
    run_button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    run_button.command = "luna.run.main";
    run_button.text = "▶ Run Luna";
    run_button.tooltip = "Run main.luna (F12)";
    run_button.show();

    openwiki_button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    openwiki_button.command = "luna.openwiki";
    openwiki_button.text = "🌍 Open Luna wiki";
    openwiki_button.tooltip = "Go to Luna wiki";
    openwiki_button.show();

    open_luna_output = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    open_luna_output.command = "luna.openoutput";
    open_luna_output.text = "🌙 Luna output";
    open_luna_output.tooltip = "Open/Close Luna output";
    open_luna_output.show();

    // Initialize output channel
    luna_output = vscode.window.createOutputChannel('Luna');
    luna_output.show(true);
    
    if (vscode.workspace.getConfiguration('luna').get('isLunaProject')) {
        checkLatestLuna();
    }

    if (process.platform === 'win32') {
        term = 'cmd.exe';
        args1 = ['/Q','/C'];
        args2 = 'luna ';
        args3 = ' && pause';
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
        term = 'bash';
        args1 = '-c';
        args2 = './luna ';
        args3 = ' && echo Press any key to close... && read';
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
        checkLunaInstalled();
    })

    let luna_force_update = vscode.commands.registerCommand('luna.forceupdate', () => {
        luna_output.show();
        installLuna();
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
    if (luna_output) luna_output.dispose();
    if (luna_terminal) luna_terminal.dispose();
    if (run_button) run_button.dispose();
    if (openwiki_button) openwiki_button.dispose();
    if (open_luna_output) open_luna_output.dispose();
}

function runLunaFile(filePath) {
    vscode.workspace.saveAll();
    luna_output.appendLine("Launching Luna: " + filePath);
    if (luna_terminal) luna_terminal.dispose();
    luna_terminal = vscode.window.createTerminal('Luna terminal', term, [args1, args2 + filePath + args3]);
    luna_terminal.show(true);
}

function checkLatestLuna() {
    luna_output.appendLine('Luna is checking for updates, please wait...');

    // Latest Luna release (from Debian control file)
    request.get({url: 'https://raw.githubusercontent.com/XyronLabs/Luna/master/build/vscode_version'}, (err, response, body) => {
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
        luna_output.appendLine('Luna is up to date!\n');
        if (automaticHideOutput) luna_output.hide();
    }
}

function installLuna() {
    // Install latest Luna version
    luna_output.appendLine("Installing Luna " + luna_version + " to this folder: " + vscode.workspace.rootPath);
    luna_output.appendLine("Please wait until this process is finished...")
    let url = 'https://github.com/XyronLabs/Luna/releases/download/' + luna_version + '/luna-' + luna_version + '_standalone_' + process.platform + '.zip';
    request.get({url: url, encoding: 'binary'}, (err, response, body) => {
        if (err) {
            vscode.window.showErrorMessage(err);
            luna_output.appendLine(err);
        } else {
            fs.writeFileSync(vscode.workspace.rootPath + "/luna.zip", body, 'binary');

            extract_zip(vscode.workspace.rootPath + "/luna.zip", {dir: vscode.workspace.rootPath}, (err) => {
                if (err) {
                    vscode.window.showErrorMessage("Could not update Luna to version " + luna_version);
                    luna_output.appendLine("Could not update Luna to version " + luna_version + "\n");
                } else {
                    fs.unlinkSync(vscode.workspace.rootPath + "/luna.zip");
                    luna_output.appendLine("Luna was successfully updated!\n");
                    vscode.workspace.getConfiguration('luna').update('version', luna_version, vscode.ConfigurationTarget.Workspace);
                }
            });
        }
    });
}
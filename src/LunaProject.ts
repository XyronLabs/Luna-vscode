import * as vscode from 'vscode';
import * as fs from 'fs';
import { request } from 'request';
import { extract_zip } from 'extract-zip';

import { LaunchHandler } from './LaunchHandler';

export class LunaProject {

    // binariesVersion: string;
    outputChannel: vscode.OutputChannel;

    buttonLaunch: vscode.StatusBarItem;
    buttonOpenWiki: vscode.StatusBarItem;
    buttonOpenOutput: vscode.StatusBarItem;

    launchHandler: LaunchHandler;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Luna');
        this.initializeButtons();

        this.launchHandler = new LaunchHandler();
    }
    
    dispose() {
        if (this.outputChannel) this.outputChannel.dispose();
        if (this.buttonLaunch) this.buttonLaunch.dispose();
        if (this.buttonOpenWiki) this.buttonOpenWiki.dispose();
        if (this.buttonOpenOutput) this.buttonOpenOutput.dispose();
        this.launchHandler.dispose();
    }
    
    launch() {
        this.launchHandler.launch();
    }

    checkForUpdates(force?: boolean) {
        let currentVersion = this.checkCurrentBinariesVersion();
        let remoteVersion = this.checkRemoteBinariesVersion();

        if (!currentVersion || currentVersion < remoteVersion || force)
            this.updateBinaries(remoteVersion);
        else
            this.outputChannel.appendLine('Luna is up to date!\n');
    }

    updateBinaries(remoteVersion: string) {
        this.outputChannel.appendLine("Installing Luna " + remoteVersion + " to this folder: " + vscode.workspace.rootPath);
        this.outputChannel.appendLine("Please wait until this process is finished...")
        
        let url = 'https://github.com/XyronLabs/Luna/releases/download/' + remoteVersion + '/luna-' + remoteVersion + '_standalone_' + process.platform + '.zip';
        request.get({url: url, encoding: 'binary'}, (err, response, body) => {
            if (err) {
                vscode.window.showErrorMessage(err);
                this.outputChannel.appendLine(err);
            } else {
                fs.writeFileSync(vscode.workspace.rootPath + "/luna.zip", body, 'binary');

                extract_zip(vscode.workspace.rootPath + "/luna.zip", {dir: vscode.workspace.rootPath}, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage("Could not update Luna to version " + remoteVersion);
                        this.outputChannel.appendLine("Could not update Luna to version " + remoteVersion + "\n");
                    } else {
                        fs.unlinkSync(vscode.workspace.rootPath + "/luna.zip");
                        this.outputChannel.appendLine("Luna was successfully updated!\n");
                        vscode.workspace.getConfiguration('luna').update('version', remoteVersion, vscode.ConfigurationTarget.Workspace);
                    }
                });
            }
        });
    }

    private checkCurrentBinariesVersion(): string {
        return vscode.workspace.getConfiguration('luna').get('version');
    }

    private checkRemoteBinariesVersion(): string {
        this.outputChannel.appendLine("Luna is checking for updates, please wait...");
        let remoteVersion: string;

        request.get({url: 'https://raw.githubusercontent.com/XyronLabs/Luna/master/build/vscode_version'}, (err, response, body) => {
            if (err) vscode.window.showErrorMessage("Luna error: " + err);
            let text = body;
            remoteVersion = text.match("[0-9].[0-9](.[0-9])?-[0-9][0-9]([0-9])?")[0];
        });

        return remoteVersion;
    }

    private initializeButtons(): void {
        this.buttonLaunch = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.buttonLaunch.command = "luna.run.main";
        this.buttonLaunch.text = "▶ Run Luna";
        this.buttonLaunch.tooltip = "Run main.luna (F12)";
        this.buttonLaunch.show();

        this.buttonOpenWiki = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.buttonOpenWiki.command = "luna.openwiki";
        this.buttonOpenWiki.text = "🌍 Open Luna wiki";
        this.buttonOpenWiki.tooltip = "Go to Luna wiki";
        this.buttonOpenWiki.show();

        this.buttonOpenOutput = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.buttonOpenOutput.command = "luna.openoutput";
        this.buttonOpenOutput.text = "🌙 Luna output";
        this.buttonOpenOutput.tooltip = "Open/Close Luna output";
        this.buttonOpenOutput.show();
    }
}
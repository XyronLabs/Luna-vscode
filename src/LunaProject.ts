import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';

import { LaunchHandler } from './LaunchHandler';

export class LunaProject {

    public outputChannel: vscode.OutputChannel;
    private autoHideOutput: boolean;

    private buttonLaunch: vscode.StatusBarItem;
    private buttonOpenWiki: vscode.StatusBarItem;
    private buttonOpenOutput: vscode.StatusBarItem;

    private launchHandler: LaunchHandler;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Luna');
        this.autoHideOutput = vscode.workspace.getConfiguration('luna').get("autoHideOutput");
        this.initializeButtons();
        this.launchHandler = new LaunchHandler();
    
        if (vscode.workspace.getConfiguration('luna').get('isLunaProject')) {
            this.checkForUpdates(false, true);
        }
    }
    
    dispose(): void {
        if (this.outputChannel) this.outputChannel.dispose();
        if (this.buttonLaunch) this.buttonLaunch.dispose();
        if (this.buttonOpenWiki) this.buttonOpenWiki.dispose();
        if (this.buttonOpenOutput) this.buttonOpenOutput.dispose();
        this.launchHandler.dispose();
    }
    
    launch(fileName?: string): void {
        this.launchHandler.launch(fileName);
    }

    newProject(): void {
        this.checkForUpdates(true);

        this.createSettings();

        // Create main.lua and open it
        fs.appendFile(vscode.workspace.rootPath + '/main.luna','');
        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/main.luna').then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    checkForUpdates(force?: boolean, autoHide?: boolean): void {
        this.outputChannel.show();
        this.outputChannel.appendLine("Luna is checking for updates, please wait...");
        let currentVersion = this.checkCurrentBinariesVersion();
        
        this.checkRemoteBinariesVersion(remoteVersion => {
            this.outputChannel.appendLine("Current version: " + currentVersion);
            this.outputChannel.appendLine("Remote version: " + remoteVersion);
    
            if (!remoteVersion) {
                this.outputChannel.appendLine("Error fetching the latest version!");
                return;
            }
    
            if (!currentVersion || currentVersion < remoteVersion || force)
                this.updateBinaries(remoteVersion);
            else
                this.outputChannel.appendLine('Luna is up to date!\n');
            
            if (this.autoHideOutput && autoHide)
                this.outputChannel.hide();
        });
    }

    updateBinaries(remoteVersion: string): void {
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

    private checkRemoteBinariesVersion(_callback): void {
        request.get({url: 'https://raw.githubusercontent.com/XyronLabs/Luna/master/build/vscode_version'}, (err, response, body) => {
            _callback(body);
        });
    }

    private initializeButtons(): void {
        this.buttonLaunch = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.buttonLaunch.command = "luna.run.main";
        this.buttonLaunch.text = "▶ Run Luna";
        this.buttonLaunch.tooltip = "Run main.luna (F12)";
        this.buttonLaunch.show();

        this.buttonOpenWiki = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.buttonOpenWiki.command = "luna.open.wiki";
        this.buttonOpenWiki.text = "🌍 Open Luna wiki";
        this.buttonOpenWiki.tooltip = "Go to Luna wiki";
        this.buttonOpenWiki.show();

        this.buttonOpenOutput = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.buttonOpenOutput.command = "luna.open.output";
        this.buttonOpenOutput.text = "🌙 Luna output";
        this.buttonOpenOutput.tooltip = "Show Luna output";
        this.buttonOpenOutput.show();
    }

    private createSettings(): void {
        vscode.workspace.getConfiguration('files').update('exclude', {"**/*.dll": true, "**/res": true, "**/luna.exe": true, "**/luna": true, "**/.vscode": true}, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('isLunaProject', true, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('autoHideOutput', true, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('window').update('title', "${dirty}${activeEditorMedium}${separator}${rootName} - Luna Editor", vscode.ConfigurationTarget.Workspace);
    }
}
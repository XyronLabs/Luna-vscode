import * as vscode from 'vscode';
import { request } from 'request';

import { LaunchHandler } from './LaunchHandler';

export class LunaProject {

    // binariesVersion: string;
    outputChannel: vscode.OutputChannel;
    terminal: vscode.Terminal;

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
        if (this.terminal) this.terminal.dispose();
        if (this.buttonLaunch) this.buttonLaunch.dispose();
        if (this.buttonOpenWiki) this.buttonOpenWiki.dispose();
        if (this.buttonOpenOutput) this.buttonOpenOutput.dispose();
    }
    
    launch() {
        this.launchHandler.launch();
    }

    checkForUpdates() {
        let currentVersion = this.checkCurrentBinariesVersion();
        let remoteVersion = this.checkRemoteBinariesVersion();

        if (!currentVersion || currentVersion < remoteVersion)
            this.updateBinaries();
        else
            this.outputChannel.appendLine('Luna is up to date!\n');
    }

    updateBinaries() {

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
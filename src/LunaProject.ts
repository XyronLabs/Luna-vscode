import * as vscode from 'vscode';
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

    }

    checkForUpdates() {

    }

    updateBinaries() {

    }


    private initializeButtons() {
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
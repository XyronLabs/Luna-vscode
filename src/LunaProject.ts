import * as vscode from 'vscode';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as LunaManager from 'luna-manager';

import LaunchHandler from './LaunchHandler';
import ExtensionHandler from './ExtensionHandler';
import Logger from './Logger';

export default class LunaProject {

    private buttonLaunch: vscode.StatusBarItem;
    private buttonOpenWiki: vscode.StatusBarItem;
    private buttonOpenOutput: vscode.StatusBarItem;

    private launchHandler: LaunchHandler;
    private extensionHandler: ExtensionHandler;

    private path: string;
    private printfn: Function;

    constructor(context: vscode.ExtensionContext) {
        this.path = vscode.workspace.rootPath;
        this.printfn = msg => Logger.println(msg);

        this.registerCommands(context);
        this.initializeButtons();
        this.launchHandler = new LaunchHandler();
        this.extensionHandler = new ExtensionHandler(context);

        if (vscode.workspace.getConfiguration('luna').get('isLunaProject')
            && vscode.workspace.getConfiguration('luna').get('autoUpdateBinaries')) {
            LunaManager.checkForUpdates(this.path, this.printfn, false);
        }

    }

    dispose(): void {
        if (this.buttonLaunch) this.buttonLaunch.dispose();
        if (this.buttonOpenWiki) this.buttonOpenWiki.dispose();
        if (this.buttonOpenOutput) this.buttonOpenOutput.dispose();
        this.launchHandler.dispose();
        Logger.dispose();
    }

    launch(fileName: string): void {
        Logger.println("Launching Luna: " + fileName);
        this.launchHandler.launch(fileName);
    }

    newProject(): void {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage("Open a folder before creating a project!");
            return;
        }

        vscode.window.showInformationMessage("Please wait while Luna is installing");
        Logger.show();
        LunaManager.newProject(this.path, this.printfn);

        this.createSettings();

        // Create main.lua and open it
        fs.writeFileSync(vscode.workspace.rootPath + '/main.luna','');
        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/main.luna').then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    downloadDemo(): void {
        // Download file list
        fetch('https://raw.githubusercontent.com/XyronLabs/Luna-demos/master/files.json')
            .then(res => res.json())
            .then((data: string[]) => {

                // Let user pick a demo file
                vscode.window.showQuickPick(data)
                    .then(selected => {
                        if (!selected) { return; }

                        fetch('https://raw.githubusercontent.com/XyronLabs/Luna-demos/master/' + selected)
                            .then(data => data.text())
                            .then(data => {
                                if (fs.existsSync(vscode.workspace.rootPath + '/main.luna')) {
                                    let newFileName = '/main.old-' + Date.now() + '.luna';
                                    fs.renameSync(vscode.workspace.rootPath + '/main.luna', vscode.workspace.rootPath + newFileName);
                                    vscode.window.showInformationMessage("Luna: Your main.luna has been renamed to " + newFileName);
                                }
                                fs.writeFileSync(vscode.workspace.rootPath + '/main.luna', data);
                            })
                            .then(() => vscode.window.showInformationMessage('Luna: Demo downloaded!'))
                            .catch(error => vscode.window.showErrorMessage("Luna error: couldn't download the specified demo"));

                    });
            })
            .catch(error => vscode.window.showErrorMessage("Luna error: Couldn't fetch demo file list"));
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
        vscode.workspace.getConfiguration('files').update('exclude', {"**/*.dll": true, "**/res": true, "**/luna.exe": true, "**/luna.json": true, "**/.vscode": true, "luna": true}, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('isLunaProject', true, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('autoHideOutput', true, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('window').update('title', "${dirty}${activeEditorMedium}${separator}${rootName} - Luna Editor", vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('autoUpdateBinaries', true, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('autoUpdateExtensions', true, vscode.ConfigurationTarget.Workspace);
    }

    private registerCommands(context: vscode.ExtensionContext): void {
        let luna_run_current    = vscode.commands.registerCommand('luna.run.current', () => this.launch(vscode.window.activeTextEditor.document.fileName));
        let luna_run_main       = vscode.commands.registerCommand('luna.run.main',    () => this.launch("main.luna"));
        let luna_create_project = vscode.commands.registerCommand('luna.initproject', () => this.newProject());
        let luna_update         = vscode.commands.registerCommand('luna.update',      () => LunaManager.checkForUpdates(this.path, this.printfn));
        let luna_force_update   = vscode.commands.registerCommand('luna.forceupdate', () => LunaManager.checkForUpdates(this.path, this.printfn, true));
        let luna_open_wiki      = vscode.commands.registerCommand('luna.open.wiki',   () => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("https://github.com/XyronLabs/Luna/wiki")));
        let luna_open_output    = vscode.commands.registerCommand('luna.open.output', () => Logger.show());
        let luna_download_demo  = vscode.commands.registerCommand('luna.download_demo', () => this.downloadDemo());

        context.subscriptions.push(luna_run_current);
        context.subscriptions.push(luna_run_main);
        context.subscriptions.push(luna_create_project);
        context.subscriptions.push(luna_update);
        context.subscriptions.push(luna_force_update);
        context.subscriptions.push(luna_open_wiki);
        context.subscriptions.push(luna_open_output);
        context.subscriptions.push(luna_download_demo);
    }
}
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';
import * as extract_zip from 'extract-zip';

import LaunchHandler from './LaunchHandler';
import ExtensionHandler from './ExtensionHandler';
import Logger from './Logger';

export default class LunaProject {

    private buttonLaunch: vscode.StatusBarItem;
    private buttonOpenWiki: vscode.StatusBarItem;
    private buttonOpenOutput: vscode.StatusBarItem;

    private launchHandler: LaunchHandler;
    private extensionHandler: ExtensionHandler;

    constructor(context: vscode.ExtensionContext) {
        
        this.registerCommands(context);
        this.initializeButtons();
        this.launchHandler = new LaunchHandler();
        this.extensionHandler = new ExtensionHandler(context);
        
        if (vscode.workspace.getConfiguration('luna').get('autoUpdateExtensions')) {
            this.extensionHandler.checkInstalledExtensions();
        }
    
        if (vscode.workspace.getConfiguration('luna').get('isLunaProject')
            && vscode.workspace.getConfiguration('luna').get('autoUpdateBinaries')) {
            this.checkForUpdates(false, true);
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
        this.checkForUpdates(true);

        this.createSettings();

        // Create main.lua and open it
        fs.appendFile(vscode.workspace.rootPath + '/main.luna','');
        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/main.luna').then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    checkForUpdates(force?: boolean, autoHide?: boolean): void {
        Logger.show();
        Logger.println("Luna is checking for updates, please wait...");
        let currentVersion = this.checkCurrentBinariesVersion();
        
        this.checkRemoteBinariesVersion(remoteVersion => {
            Logger.println("Current version: " + currentVersion);
            Logger.println("Remote version: " + remoteVersion);
    
            if (!remoteVersion) {
                Logger.println("Error fetching the latest version!");
                return;
            }
    
            if (!currentVersion || currentVersion < remoteVersion || force)
                this.updateBinaries(remoteVersion);
            else
                Logger.println('Luna is up to date!\n');
            
            if (Logger.autoHideOutput && autoHide)
                Logger.hide();
        });
    }

    updateBinaries(remoteVersion: string): void {
        Logger.println("Installing Luna " + remoteVersion + " to this folder: " + vscode.workspace.rootPath);
        Logger.println("Please wait until this process is finished...")
        
        let url = 'https://github.com/XyronLabs/Luna/releases/download/' + remoteVersion + '/luna-' + remoteVersion + '_standalone_' + process.platform + '.zip';
        request.get({url: url, encoding: 'binary'}, (err, response, body) => {
            if (err) {
                vscode.window.showErrorMessage(err);
                Logger.println(err);
            } else {
                fs.writeFileSync(vscode.workspace.rootPath + "/luna.zip", body, 'binary');

                extract_zip(vscode.workspace.rootPath + "/luna.zip", {dir: vscode.workspace.rootPath}, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage("Could not update Luna to version " + remoteVersion);
                        Logger.println("Could not update Luna to version " + remoteVersion + "\n");
                    } else {
                        fs.unlinkSync(vscode.workspace.rootPath + "/luna.zip");
                        Logger.println("Luna was successfully updated!\n");
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
        vscode.workspace.getConfiguration('luna').update('autoUpdateBinaries', true, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('luna').update('autoUpdateExtensions', true, vscode.ConfigurationTarget.Workspace);
    }

    private registerCommands(context: vscode.ExtensionContext): void {
        let luna_run_current    = vscode.commands.registerCommand('luna.run.current', () => this.launch(vscode.window.activeTextEditor.document.fileName));
        let luna_run_main       = vscode.commands.registerCommand('luna.run.main',    () => this.launch(vscode.workspace.rootPath + "/main.luna"));
        let luna_create_project = vscode.commands.registerCommand('luna.initproject', () => this.newProject());
        let luna_update         = vscode.commands.registerCommand('luna.update',      () => this.checkForUpdates());
        let luna_force_update   = vscode.commands.registerCommand('luna.forceupdate', () => this.checkForUpdates(true));
        let luna_open_wiki      = vscode.commands.registerCommand('luna.open.wiki',   () => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("https://github.com/XyronLabs/Luna/wiki")));
        let luna_open_output    = vscode.commands.registerCommand('luna.open.output', () => Logger.show());

        context.subscriptions.push(luna_run_current);
        context.subscriptions.push(luna_run_main);
        context.subscriptions.push(luna_create_project);
        context.subscriptions.push(luna_update);
        context.subscriptions.push(luna_force_update);
        context.subscriptions.push(luna_open_wiki);
        context.subscriptions.push(luna_open_output);
    }
}
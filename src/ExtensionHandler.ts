import * as request from 'request';
import * as fs from 'fs';
import { workspace, ExtensionContext, commands, window } from 'vscode';
import * as LunaManager from 'luna-manager'

import Logger from './Logger';

interface LunaExtension {
    name: string;
    description: string;
    version: string;
    path: string;
    dependencies?: string[];
    files?: string[];
}

export default class ExtensionHandler {

    private baseUrl: string;
    private extensionFolder: string;
    private path: string;
    private printfn: Function;

    constructor(context: ExtensionContext) {
        this.baseUrl = "https://raw.githubusercontent.com/XyronLabs/Luna-extensions/master/";
        this.extensionFolder = workspace.rootPath + "/res/lua/extensions/";
        this.path = workspace.rootPath;
        this.printfn = msg => Logger.println(msg);

        this.registerCommands(context);

        if (workspace.getConfiguration('luna').get('autoUpdateExtensions')) {
            LunaManager.checkInstalledExtensions(this.path, this.printfn);
        }
    }

    installExtension() {
        request.get({url: this.baseUrl + "luna_extensions.json"}, (err, response, body) => {
            if (err) { window.showErrorMessage("Couldn't get extension list"); return; }
            let options = JSON.parse(body);

            window.showQuickPick(options).then(packageName => {
                if (!packageName) return;

                LunaManager.updateExtension(this.path, this.printfn, packageName);
            });
        });
    }

    removeExtension() {
        let extensions = LunaManager.checkFolderForExtensions(this.path);
        let extensionsData: LunaExtension[] = [];
        extensions.forEach(e => {
            extensionsData.push(require(LunaManager.getExtensionData(this.path, e)));
        });
        
        this.getQuickPickSelection(extensionsData, selected => {
            LunaManager.removeExtension(this.path, this.printfn, selected, extensionsData, err => {
                window.showErrorMessage(err);
            })
        });
        
    }

    private getQuickPickSelection(options: LunaExtension[], _callback): void {
        let names = options.map(o => o.name);

        window.showQuickPick(names).then(selected => {
            if (!selected) return;

            let a: LunaExtension | void = options.find(e => e.name == selected);
            _callback(a);
        })
    }

    private registerCommands(context: ExtensionContext): void {
        let install_extension = commands.registerCommand('luna.extensions.install', () => this.installExtension());
        let update_extensions = commands.registerCommand('luna.extensions.update', () => LunaManager.checkInstalledExtensions(this.path, this.printfn));
        let remove_extension = commands.registerCommand('luna.extensions.remove', () => this.removeExtension());
        let force_update_extensions = commands.registerCommand('luna.extensions.forceupdate', () => LunaManager.checkInstalledExtensions(this.path, this.printfn, true));

        context.subscriptions.push(install_extension);
        context.subscriptions.push(update_extensions);
        context.subscriptions.push(remove_extension);
        context.subscriptions.push(force_update_extensions);
    }
}
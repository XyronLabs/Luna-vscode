import * as request from 'request';
import * as fs from 'fs';
import { workspace, ExtensionContext, commands, window, InputBoxOptions } from 'vscode';

interface LunaExtension {
    name: string;
    description: string;
    version: string;
    files: string[];
}

export default class ExtensionHandler {

    private baseUrl: string;
    private extensionFolder: string;

    constructor(context: ExtensionContext) {
        this.baseUrl = "https://raw.githubusercontent.com/XyronLabs/Luna-extensions/master/";
        this.extensionFolder = workspace.rootPath + "/res/lua/extensions/";

        this.registerCommands(context);
    }

    installExtension() {
        request.get({url: this.baseUrl + "luna_extensions.json"}, (err, response, body) => {
            if (err) { window.showErrorMessage("Couldn't get extension list"); return; }
            let options = JSON.parse(body);
               
            window.showQuickPick(options).then(packageName => {
                if (!packageName) return;

                this.updateExtension(packageName);
            });
        });
    }

    checkInstalledExtensions(force?: boolean) {
        let extensions = this.checkFolderForExtensions();
        
        extensions.forEach(e => {
            let extensionData: LunaExtension = require(this.getExtensionData(e));
            
            request.get({url: this.baseUrl + e + "/extension.json"}, (err, response, body) => {
                let remoteData: LunaExtension = JSON.parse(body);
                console.log(`Extension: ${extensionData.name}, local version = ${extensionData.version}, remote version = ${remoteData.version}`)

                if (extensionData.version < remoteData.version || force) {
                    this.updateExtension(e);
                }
            })
        })
    }

    private checkFolderForExtensions(folder: string = "", extensionList: string[] = []) {
        let folders = fs.readdirSync(this.extensionFolder + folder);
        folders.forEach(f => {
            if (fs.existsSync(this.getExtensionData(folder + "/" + f))) {
                extensionList.push(folder + "/" + f);
            } else {
                return this.checkFolderForExtensions(folder + "/" + f, extensionList);
            }
        })

        return extensionList;
    }

    private updateExtension(packageName: string) {
        request.get({url: this.baseUrl + packageName + "/extension.json"}, (err, response, body) => {
            if (err) { window.showErrorMessage("Couldn't get extension data"); return; }
            let obj: LunaExtension = JSON.parse(body);
            obj.files.push("init.lua");
            obj.files.push("extension.json");

            let directoryTree = "";
            for (let currDir of packageName.split('/')) {
                directoryTree += currDir + "/";
                
                if (!fs.existsSync(this.extensionFolder + directoryTree))
                    fs.mkdirSync(this.extensionFolder + directoryTree);
            }

            window.showInformationMessage("Installing " + obj.name + " " + obj.version);

            for(let f of obj.files) {
                request.get({url: this.baseUrl + packageName + "/" + f}, (err, response, body) => {
                    if (err) { window.showErrorMessage("Couldn't download file: " + f); return; }
                    fs.writeFileSync(this.extensionFolder + packageName + "/" + f, body);
                });
            }
            
            window.showInformationMessage("Installed " + obj.name + " " + obj.version + " successfully!");
        });
    }

    private getExtensionData(packageName: string): string {
        return this.extensionFolder + packageName + "/extension.json";
    }

    private registerCommands(context: ExtensionContext): void {
        let install_extension = commands.registerCommand('luna.extensions.install', () => this.installExtension());
        let update_extensions = commands.registerCommand('luna.extensions.update', () => this.checkInstalledExtensions());
        let force_update_extensions = commands.registerCommand('luna.extensions.forceupdate', () => this.checkInstalledExtensions(true));

        context.subscriptions.push(install_extension);
        context.subscriptions.push(update_extensions);
        context.subscriptions.push(force_update_extensions);
    }
}
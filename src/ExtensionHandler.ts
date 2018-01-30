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

                request.get({url: this.baseUrl + packageName + "/extension.json"}, (err, response, body) => {
                    if (err) { window.showErrorMessage("Couldn't get extension data"); return; }
                    let obj: LunaExtension = JSON.parse(body);
                    obj.files.push("init.lua");
                    obj.files.push("extension.json");
        
                    if (!fs.existsSync(this.extensionFolder + packageName + "/"))
                        fs.mkdirSync(this.extensionFolder + packageName + "/");

                    window.showInformationMessage("Installing " + obj.name + " " + obj.version);

                    for(let f of obj.files) {
                        request.get({url: this.baseUrl + packageName + "/" + f}, (err, response, body) => {
                            if (err) { window.showErrorMessage("Couldn't download file: " + f); return; }
                            fs.writeFileSync(this.extensionFolder + packageName + "/" + f, body);
                        });
                    }
                    
                    window.showInformationMessage("Installed " + obj.name + " " + obj.version + " successfully!");
                });
                
            });
        });
    }

    private registerCommands(context: ExtensionContext): void {
        let install_extension = commands.registerCommand('luna.install.extension', () => this.installExtension());

        context.subscriptions.push(install_extension);
    }
}
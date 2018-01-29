import * as request from 'request';
import * as fs from 'fs';
import { workspace, ExtensionContext, commands, window } from 'vscode';

export default class ExtensionHandler {

    constructor(context: ExtensionContext) {
        this.registerCommands(context);
    }

    installExtension(packageName: string) {
        request.get({url: "https://raw.githubusercontent.com/XyronLabs/Luna-extensions/master/" + packageName + "/extension.json", encoding: 'binary'}, (err, response, body) => {
            let obj = JSON.parse(body);
            obj.files.push("init.lua");
            obj.files.push("extension.json");

            if (!fs.existsSync(workspace.rootPath + "/res/lua/extensions/" + packageName + "/"))
                fs.mkdirSync(workspace.rootPath + "/res/lua/extensions/" + packageName + "/");

            for(let f of obj.files) {
                request.get({url: "https://raw.githubusercontent.com/XyronLabs/Luna-extensions/master/" + packageName + "/" + f, encoding: 'binary'}, (err, response, body) => {
                    fs.writeFileSync(workspace.rootPath + "/res/lua/extensions/" + packageName + "/" + f, body, 'binary');
                });
            }
        });
    }

    private registerCommands(context: ExtensionContext): void {
        let install_extension = commands.registerCommand('luna.install.extension', () => {
            window.showInputBox().then(packageName => {
                // new ExtensionHandler().installExtension(packageName);
            })
        });
        context.subscriptions.push(install_extension);
    }
}
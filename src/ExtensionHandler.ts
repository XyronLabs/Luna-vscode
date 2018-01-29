import * as request from 'request';
import * as fs from 'fs';
import { workspace } from 'vscode';

export default class ExtensionHandler {

    constructor() {

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
}
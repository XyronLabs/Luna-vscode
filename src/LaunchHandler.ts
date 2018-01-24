import * as vscode from 'vscode';

export class LaunchHandler {

    term: string;
    args1: any;
    args2: string;
    args3: string;
    terminal: vscode.Terminal;

    constructor() {
        if (process.platform === 'win32') {
            this.term = 'cmd.exe';
            this.args1 = ['/Q','/C'];
            this.args2 = 'luna ';
            this.args3 = ' && pause';
        } else if (process.platform === 'linux' || process.platform === 'darwin') {
            this.term = 'bash';
            this.args1 = '-c';
            this.args2 = './luna ';
            this.args3 = ' && echo Press any key to close... && read';
        }
    }

    launch(fileName?: string) {
        if (!fileName) fileName = "main.luna";

        vscode.workspace.saveAll().then(() => {
            if (this.terminal) this.terminal.dispose();
            this.terminal = vscode.window.createTerminal('Luna terminal', this.term, [this.args1, this.args2 + fileName + this.args3]);
            this.terminal.show(true);
        });
    }

    dispose() {
        if (this.terminal) this.terminal.dispose();
    }
}
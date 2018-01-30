import { OutputChannel, window } from "vscode";


export default class Logger {
    private static outputChannel: OutputChannel = window.createOutputChannel('Luna');
    private static dateTime: Date = new Date();

    static println(text: string): void {
        this.dateTime.setTime(Date.now());
        this.outputChannel.appendLine("[" + this.dateTime.toLocaleString() + "] " + text);
    }
}
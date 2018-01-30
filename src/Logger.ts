import { OutputChannel, window, workspace } from "vscode";


export default class Logger {
    private static outputChannel: OutputChannel = window.createOutputChannel('Luna');
    private static dateTime: Date = new Date();
    public static autoHideOutput: boolean = workspace.getConfiguration('luna').get("autoHideOutput");

    static println(text: string): void {
        this.dateTime.setTime(Date.now());
        this.outputChannel.appendLine("[" + this.dateTime.toLocaleString() + "] " + text);
    }

    static show(): void {
        this.outputChannel.show();
    }

    static hide(): void {
        this.outputChannel.hide();
    }

    static dispose(): void {
        if (this.outputChannel) this.outputChannel.dispose();
    }
}
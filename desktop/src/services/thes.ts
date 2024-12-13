import { BrowserWindow, dialog } from "electron";
import { WriteepiDesktop } from "../main.js";
import { existsSync, readFileSync } from 'node:fs';
import path from "path";
import { fileURLToPath } from "url";
import { encode } from 'html-entities';

export class Thes {
    desktop: WriteepiDesktop;
    database: any = [];

    dirname = path.dirname(fileURLToPath(import.meta.url));

    constructor(desktop: WriteepiDesktop) {
        this.desktop = desktop;
    }

    setLang = (event: any, lang: string) => {
        let dat = '';
        switch (lang) {
            case 'en':
            case 'fr':
            case 'it':
            case 'de':
            case 'es':
                dat = path.join(this.dirname, '../resources/thes', lang + '.dat');
                break;
            default:
                dat = path.join(this.dirname, '../resources/thes', 'en.dat');
                break;
        }
        this.load(dat);
    }


    handleSearch = async (event: any, text: string) => {
        const result: string[] = this.find(text);
        if (this.desktop.mainWindow != null) {
            let message = '<ul>';
            result.forEach(element => {
                message += "<li>" + encode(element) + '</li>';
            });
            message += "</ul>"

            let childWindow = new BrowserWindow({
                height: 450,
                width: 350,
                show: false,
                minimizable: false,
                maximizable: false,
                parent: this.desktop.mainWindow,
                webPreferences: {
                    nodeIntegration: true,
                }
            });
            childWindow.setIcon(path.join(this.dirname, '..', 'favicon.png'));

            childWindow.setTitle('Thesaurus');
            childWindow.removeMenu();

            const content = result.length > 0 ? message : "No results";
            const html = "<html><head><meta charset=\"UTF-8\"></head><body><h2>" + text + ":</h2>" + content + "</body></html>";

            childWindow.loadURL("data:text/html;base64," + Buffer.from(html).toString("base64"));
            childWindow.show();
        }
        return result;
    }

    private load = (inputFile: string) => {
        let columns, line, syn, _i, _j, _len, _len1, _ref1;
        this.reset();
        if (!existsSync(inputFile)) {
            dialog.showErrorBox("Thesaurus", "Cannot load thesaurus data");
            return;
        }
        const input = readFileSync(inputFile, "utf8");
        let current = {
            meanings: 0,
            word: ''
        };

        const _ref = input.split('\n').slice(1);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            line = _ref[_i];
            columns = line?.split('|');
            if (columns !== undefined) {
                if (current.meanings === 0) {
                    current.word = columns[0] !== undefined ? columns[0] : '';
                    current.meanings = Number(columns[1]);
                    this.database[current.word] = [];
                } else {
                    --current.meanings;
                    _ref1 = columns.slice(1);
                    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                        syn = _ref1[_j];
                        if (syn == null || syn === "") {
                            continue;
                        }
                        syn = syn.trim();
                        if (this.indexOf(this.database[current.word], syn) >= 0) {
                            continue;
                        }
                        try {
                            this.database[current.word].push(syn);
                        } catch (e) {
                            console.log("Cannot add word: " + current.word);
                            console.log(e);
                        }
                    }
                }
            }
        }
        return this;
    };

    private indexOf = (word: string[], item: string) => {
        for (let i = 0, l = word.length; i < l; i++) {
            if (i in word && word[i] === item) {
                return i;
            }
        }
        return -1;
    }

    private reset = () => {
        this.database = [];
    };

    private find = (key: string) => {
        let _ref;
        key = key.toLowerCase();
        return (_ref = this.database[key]) != null ? _ref : [];
    };

    private toJson = () => {
        return JSON.stringify(this.database, void 0, 2);
    };
}
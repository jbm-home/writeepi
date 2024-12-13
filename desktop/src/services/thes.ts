import { app, dialog } from "electron";
import { WriteepiDesktop } from "../main.js";
import Store from 'electron-store';
import { existsSync, readFileSync } from 'original-fs';

export class Thes {
    desktop: WriteepiDesktop;
    database: any = [];

    constructor(desktop: WriteepiDesktop) {
        this.desktop = desktop;
    }

    setLang = (event: any, lang: string) => {
        const basePath = 'dist/desktop/src/resources/thes/';
        let path = '';
        switch (lang) {
            case 'en':
            case 'fr':
            case 'it':
            case 'de':
            case 'es':
                path = basePath + lang + '.dat';
                break;
            default:
                path = basePath + 'en.dat';
                break;
        }
        this.load(path);
    }


    handleSearch = async (event: any, text: string) => {
        const result: string[] = this.find(text);
        if (this.desktop.mainWindow != null) {
            let message = '';
            result.forEach(element => {
                message += element + '\n';
            });
            dialog.showMessageBoxSync(this.desktop.mainWindow, { message: message, title: 'Thesaurus' });
        }
        return result;
    }

    private load = (inputFile: string) => {
        let columns, line, syn, _i, _j, _len, _len1, _ref1;
        this.reset();
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
                        if ((syn == null) || syn === "") {
                            continue;
                        }
                        syn = syn.trim();
                        if (this.indexOf(this.database[current.word], syn) >= 0) {
                            continue;
                        }
                        this.database[current.word].push(syn);
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
        return this.database = [];
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
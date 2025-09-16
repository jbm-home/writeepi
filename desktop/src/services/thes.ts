import { BrowserWindow, dialog } from "electron";
import { WriteepiDesktop } from "../main.js";
import path from "path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "url";
import { encode } from "html-entities";
import { ThesDatabase } from "../common/thesDatabase.js";

export class Thes {
  desktop: WriteepiDesktop;
  database: ThesDatabase = new ThesDatabase();

  dirname = path.dirname(fileURLToPath(import.meta.url));

  constructor(desktop: WriteepiDesktop) {
    this.desktop = desktop;
  }

  setLang = (event: any, lang: string) => {
    let dat = "";
    switch (lang) {
      case "en":
      case "fr":
      case "it":
      case "de":
      case "es":
        dat = path.join(this.dirname, "../resources/thes", lang + ".dat.json");
        break;
      default:
        dat = path.join(this.dirname, "../resources/thes", "en.dat.json");
        break;
    }
    this.load(dat);
  };

  handleSearch = async (event: any, text: string) => {
    const result: string[] = this.database.getFromKey(text);
    if (this.desktop.mainWindow != null) {
      let message = "<ul>";
      result.forEach((element) => {
        message += "<li>" + encode(element) + "</li>";
      });
      message += "</ul>";

      const childWindow = new BrowserWindow({
        height: 450,
        width: 350,
        show: false,
        minimizable: false,
        maximizable: false,
        parent: this.desktop.mainWindow,
        webPreferences: {
          nodeIntegration: true,
        },
      });
      childWindow.setIcon(path.join(this.dirname, "..", "favicon.png"));

      childWindow.setTitle("Thesaurus");
      childWindow.removeMenu();

      const content = result.length > 0 ? message : "No results";
      const html =
        '<html><head><meta charset="UTF-8"></head><body><h2>' +
        text +
        ":</h2>" +
        content +
        "</body></html>";

      childWindow.loadURL(
        "data:text/html;base64," + Buffer.from(html).toString("base64"),
      );
      childWindow.show();
    }
    return result;
  };

  private load = (inputFile: string) => {
    try {
      if (existsSync(inputFile)) {
        this.database.load(JSON.parse(readFileSync(inputFile, "utf8")).items);
      }
    } catch (e) {
      console.log("Cannot load thes: " + inputFile);
    }
  };
}

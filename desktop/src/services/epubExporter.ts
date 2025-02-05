import { WriteepiDesktop } from "../main.js";
import { UserProject } from "../../../webui/src/app/types/userproject.js"
import { writeFileSync } from 'original-fs';
import { dialog } from "electron";
import { EpubCommon } from "./epubCommon.js";

export class EpubExporter {
    desktop?: WriteepiDesktop;

    constructor(desktop?: WriteepiDesktop) {
        this.desktop = desktop;
    }

    handleBuildEpub = async (event: any, id: string) => {
        if (this.desktop?.mainWindow != null) {
          let result = await dialog.showSaveDialog(this.desktop.mainWindow, { filters: [{ name: 'ePub', extensions: ['epub'] }] });
          if (!result.canceled && result.filePath != null) {
    
            let backup = this.desktop.mainstore.get('current') as any[];
            if (backup === undefined || backup.length === 0) {
              return true;
            }
            const userContent: UserProject = backup.find((elem) => elem.id === id);
            const exporter = new EpubCommon();
            const buffer = await exporter.buildEpub(userContent);
            writeFileSync(result.filePath, buffer);
            return false;
          }
        }
        return true;
      }
}
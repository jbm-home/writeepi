import { dialog } from "electron";
import { WriteepiDesktop } from "../main.js";
import { UserProject } from "../../../webui/src/app/types/userproject.js";
import { writeFileSync } from "original-fs";
import { DocxCommon } from "./docxCommon.js";

export class DocxExporter {
  desktop: WriteepiDesktop;

  constructor(desktop: WriteepiDesktop) {
    this.desktop = desktop;
  }

  handleBuildDocx = async (event: any, id: string) => {
    if (this.desktop !== undefined && this.desktop.mainWindow != null) {
      const result = await dialog.showSaveDialog(this.desktop.mainWindow, {
        filters: [{ name: "DOCX", extensions: ["docx"] }],
      });
      if (!result.canceled && result.filePath != null) {
        const backup = this.desktop.mainstore.get("current") as any[];
        if (backup === undefined || backup.length === 0) {
          return true;
        }
        const userContent: UserProject = backup.find((elem) => elem.id === id);
        const exporter = new DocxCommon();
        const buffer = await exporter.buildDocx(userContent);
        if (buffer !== undefined) {
          writeFileSync(result.filePath, buffer);
          return false;
        }
      }
    }
    return true;
  };
}

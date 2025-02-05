import { dialog } from 'electron';
import { WriteepiDesktop } from '../main.js';
import { UserProject } from '../../../webui/src/app/types/userproject.js';
import { PdfCommon } from './pdfCommon.js';

export class PdfExporter {
    desktop?: WriteepiDesktop;

    constructor(desktop?: WriteepiDesktop) {
        this.desktop = desktop;
    }

    async handleBuildPdf (event: any, id: string) {
        if (this.desktop?.mainWindow != null) {
            let result = await dialog.showSaveDialog(this.desktop.mainWindow, { filters: [{ name: 'PDF', extensions: ['pdf'] }] });
            if (!result.canceled && result.filePath != null) {
                let backup = this.desktop.mainstore.get('current') as any[];
                if (backup === undefined || backup.length === 0) {
                    return true;
                }
                const userContent: UserProject = backup.find((elem) => elem.id === id)
                const exporter = new PdfCommon();
                exporter.buildPdf(userContent, result.filePath);
                return false;
            }
        }
        return true;
    }
}
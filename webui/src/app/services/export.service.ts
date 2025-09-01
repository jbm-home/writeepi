import { Injectable } from '@angular/core';
import axios from 'axios';
import { AppComponent } from '../app.component.js';
import { ElectronService } from './electron.service.js';

@Injectable({
    providedIn: 'root'
})
export class ExportService {
    constructor(private electronService: ElectronService) { }

    async exportPdf(id: string) {
        if (AppComponent.CLOUDMODE) {
            const pdf: Blob = await axios.get('/api/export/pdf/' + id, {
                responseType: "blob"
            });
            return pdf;
        } else {
            return await this.electronService.api.buildPdf(id);
        }
    }

    async exportDocx(id: string) {
        if (AppComponent.CLOUDMODE) {
            const docx: any = await axios.get('/api/export/docx/' + id, {
                responseType: "arraybuffer",
            });
            return new Blob([docx], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        } else {
            return await this.electronService.api.buildDocx(id);
        }
    }

    async exportEpub(id: string) {
        if (AppComponent.CLOUDMODE) {
            const epub: any = await axios.get('/api/export/epub/' + id, {
                responseType: "arraybuffer",
            });
            return new Blob([epub], { type: 'application/epub+zip' });
        } else {
            return await this.electronService.api.buildEpub(id);
        }
    }
}

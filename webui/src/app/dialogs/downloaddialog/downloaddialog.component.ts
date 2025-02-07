import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ElectronService } from '../../services/electron.service.js';
import { AppComponent } from '../../app.component.js';
import { SharedModule } from '../../shared.module.js';
import { ExportService } from '../../services/export.service.js';
import { Buffer } from 'buffer';

@Component({
  selector: 'app-downloaddialog',
  imports: [SharedModule],
  templateUrl: './downloaddialog.component.html',
  styleUrl: './downloaddialog.component.scss'
})
export class DownloaddialogComponent implements OnInit {
  constructor(
    private electronService: ElectronService,
    public dialogRef: MatDialogRef<any>,
    private exportService: ExportService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ready = false;
  error = false;
  started = false;

  ngOnInit(): void {
    //
  }

  async downloadPdf() {
    this.error = false;
    this.ready = false;
    this.started = true;
    const exportResult = await this.exportService.exportPdf(this.data.uuid);
    if (AppComponent.CLOUDMODE) {
      this.error = false;
      this.saveFile(exportResult, this.data.uuid + ".pdf");
    } else {
      this.error = exportResult;
    }
    this.ready = true;
  }

  async downloadEpub() {
    this.error = false;
    this.ready = false;
    this.started = true;
    const exportResult = await this.exportService.exportEpub(this.data.uuid);
    if (AppComponent.CLOUDMODE) {
      this.saveFile(exportResult, this.data.uuid + ".epub");
      this.error = false;
    } else {
      this.error = exportResult;
    }
    this.ready = true;
  }

  async downloadDocx() {
    this.error = false;
    this.ready = false;
    this.started = true;
    const exportResult = await this.exportService.exportDocx(this.data.uuid);
    if (AppComponent.CLOUDMODE) {
      this.saveFile(exportResult, this.data.uuid + ".docx");
      this.error = false;
    } else {
      this.error = exportResult;
    }
    this.ready = true;
  }

  private saveFile(blob: Blob, filename: string) {
    const data = window.URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = data;
    link.download = filename;
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(data);
    }, 400)
  }

  ok(): void {
    this.dialogRef.close();
  }
}

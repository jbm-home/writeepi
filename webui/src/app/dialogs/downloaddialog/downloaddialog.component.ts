import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppComponent } from '../../app.component.js';
import { SharedModule } from '../../shared.module.js';
import { ExportService } from '../../services/export.service.js';
import { BackupService } from '../../services/backup.service.js';

@Component({
  selector: 'app-downloaddialog',
  imports: [SharedModule],
  templateUrl: './downloaddialog.component.html',
  styleUrl: './downloaddialog.component.scss',
})
export class DownloaddialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<any>,
    private exportService: ExportService,
    private backupService: BackupService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

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
      this.saveFile(exportResult, this.data.uuid + '.pdf');
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
      this.saveFile(exportResult, this.data.uuid + '.epub');
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
      this.saveFile(exportResult, this.data.uuid + '.docx');
      this.error = false;
    } else {
      this.error = exportResult;
    }
    this.ready = true;
  }

  private saveFile(blob: Blob, filename: string) {
    const data = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(data);
    }, 400);
  }

  async downloadJson() {
    this.error = false;
    this.ready = false;
    this.started = true;
    const exportResult = await this.backupService.loadBackup(this.data.uuid);
    if (AppComponent.CLOUDMODE) {
      const blob = new Blob([JSON.stringify(exportResult)], {
        type: 'application/json',
      });
      this.saveFile(blob, this.data.uuid + '.json');
      this.error = false;
    } else {
      this.error = exportResult;
    }
    this.ready = true;
  }

  ok(): void {
    this.dialogRef.close();
  }
}

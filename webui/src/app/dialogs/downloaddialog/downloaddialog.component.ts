import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ElectronService } from '../../services/electron.service.js';
import { AppComponent } from '../../app.component.js';
import { SharedModule } from '../../shared.module.js';

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
    this.error = AppComponent.CLOUDMODE ? alert('TODO: cloud mode') : await this.electronService.api.buildPdf(this.data.uuid);
    this.ready = true;
  }

  async downloadEpub() {
    this.error = false;
    this.ready = false;
    this.started = true;
    this.error = AppComponent.CLOUDMODE ? alert('TODO: cloud mode') : await this.electronService.api.buildEpub(this.data.uuid);
    this.ready = true;
  }

  async downloadDocx() {
    this.error = false;
    this.ready = false;
    this.started = true;
    this.error = AppComponent.CLOUDMODE ? alert('TODO: cloud mode') : await this.electronService.api.buildDocx(this.data.uuid);
    this.ready = true;
  }

  ok(): void {
    this.dialogRef.close();
  }
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module.js';

@Component({
  selector: 'app-recoverdialog',
  imports: [SharedModule],
  templateUrl: './recoverdialog.component.html',
  styleUrl: './recoverdialog.component.scss',
})
export class RecoverdialogComponent {
  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ok(): void {
    this.dialogRef.close({ validated: true, data: this.data });
  }

  cancel(): void {
    this.dialogRef.close({ validated: false });
  }

  login(): void {
    this.dialogRef.close({ validated: true, login: true });
  }
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module.js';

@Component({
  selector: 'app-logindialog',
  imports: [SharedModule],
  templateUrl: './logindialog.component.html',
  styleUrl: './logindialog.component.scss'
})
export class LogindialogComponent {
  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ok(): void {
    this.dialogRef.close({ validated: true, data: this.data });
  }

  cancel(): void {
    this.dialogRef.close({ validated: false });
  }

  register(): void {
    this.dialogRef.close({ validated: true, register: true });
  }
}

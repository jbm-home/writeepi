import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-logindialog',
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
}

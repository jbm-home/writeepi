import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module.js';

@Component({
  selector: 'app-logoutdialog',
  imports: [SharedModule],
  templateUrl: './logoutdialog.component.html',
  styleUrl: './logoutdialog.component.scss'
})
export class LogoutdialogComponent {
  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ok(): void {
    this.dialogRef.close({ validated: true });
  }

  cancel(): void {
    this.dialogRef.close({ validated: false });
  }
}

import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { MatSelectionList } from '@angular/material/list';
import { MatTabGroup } from '@angular/material/tabs';
import { Failover } from '../../utils/failover.js';
import { AppComponent } from '../../app.component.js';
import { SharedModule } from '../../shared.module.js';

@Component({
  selector: 'app-browsedialog',
  imports: [SharedModule],
  templateUrl: './browsedialog.component.html',
  styleUrl: './browsedialog.component.scss'
})
export class BrowsedialogComponent implements OnInit {
  @ViewChild('tabgroup', { static: true }) tabgroup!: MatTabGroup;

  recovery: any[] = [];
  selectedProject: string[] = [];
  selectedRecovery: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    if (Failover.hasAvailableFailover()) {
      this.recovery = Failover.loadAllFailovers();
    }
  }

  get cloudMode() {
    return AppComponent.CLOUDMODE;
  }

  removeAllRecoveries() {
    Failover.cleanAllFailover();
    this.recovery = [];
  }

  storeLocation() {
    this.data.tabIndex = -1;
    this.data.store = true;
    this.dialogRef.close({ validated: true, data: this.data });
  }

  ok(): void {
    if (this.tabgroup.selectedIndex === 0) {
      this.data.tabIndex = 0;
    } else if (this.tabgroup.selectedIndex === 1 && this.selectedProject.length > 0) {
      this.data.tabIndex = 1;
      this.data.projectId = this.selectedProject[0];
    } else if (this.tabgroup.selectedIndex === 2 && this.selectedRecovery.length > 0) {
      this.data.tabIndex = 2;
      const recoveryId = this.selectedRecovery[0];
      this.data.recoveryData = this.recovery.find(r => r.id === recoveryId);
    }
    this.dialogRef.close({ validated: true, data: this.data });
  }

  cancel(): void {
    this.dialogRef.close({ validated: false });
  }
}

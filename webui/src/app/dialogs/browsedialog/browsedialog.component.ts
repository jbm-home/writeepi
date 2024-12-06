import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { MatSelectionList } from '@angular/material/list';
import { MatTabGroup } from '@angular/material/tabs';
import { Failover } from '../../utils/failover';

@Component({
  selector: 'app-browsedialog',
  templateUrl: './browsedialog.component.html',
  styleUrl: './browsedialog.component.scss'
})
export class BrowsedialogComponent implements OnInit {
  @ViewChild('openprojectslist', {static: true}) openprojectslist!: MatSelectionList;
  @ViewChild('openrecoverylist', {static: true}) openrecoverylist!: MatSelectionList;
  @ViewChild('tabgroup', {static: true}) tabgroup!: MatTabGroup;

  recovery: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    if (Failover.hasAvailableFailover()) {
      this.recovery = Failover.loadAllFailovers();
    }
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
    } else if (this.tabgroup.selectedIndex === 1 && this.openprojectslist.selectedOptions.hasValue()) {
      this.data.tabIndex = 1;
      this.data.projectId = this.openprojectslist.selectedOptions.selected[0].value;
    } else if (this.tabgroup.selectedIndex === 2 && this.openrecoverylist.selectedOptions.hasValue()) {
      this.data.tabIndex = 2;
      const recoveryId = this.openrecoverylist.selectedOptions.selected[0].value;
      this.data.recoveryData = this.recovery.find(r => r.id === recoveryId);
    }
    this.dialogRef.close({ validated: true, data: this.data });
  }

  cancel(): void {
    this.dialogRef.close({ validated: false });
  }
}

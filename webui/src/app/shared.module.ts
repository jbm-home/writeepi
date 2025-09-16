import { NgModule } from '@angular/core';
import { I18nPipe } from './pipes/i18n.pipe.js';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ResizableModule } from 'angular-resizable-element';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { QuillModule } from 'ngx-quill';

@NgModule({
  imports: [I18nPipe, DatePipe],
  exports: [
    FormsModule,
    CommonModule,
    I18nPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatListModule,
    MatIconModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatSidenavModule,
    ResizableModule,
    NgbCollapseModule,
    NgbDropdownModule,
    NgbModalModule,
    NgbTooltipModule,
    QuillModule,
  ],
})
export class SharedModule {}

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { NgbModule, NgbCollapseModule, NgbDropdownModule, NgbModalModule  } from '@ng-bootstrap/ng-bootstrap';
import { ResizableModule } from 'angular-resizable-element';
import { ModaleComponent } from './modal/modal.component';
import { TreeItemComponent } from './tree-item/tree-item.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DownloaddialogComponent } from './dialogs/downloaddialog/downloaddialog.component';
import { BrowsedialogComponent } from './dialogs/browsedialog/browsedialog.component';
import { I18nPipe } from './pipes/i18n.pipe';
import { I18nService } from './services/i18n.service';
import { LogindialogComponent } from './dialogs/logindialog/logindialog.component';
import { LogoutdialogComponent } from './dialogs/logoutdialog/logoutdialog.component';

export function setupI18nFactory(
  service: I18nService): Function {
  return () => service.use('en');
}

@NgModule({
  declarations: [
    AppComponent,
    ModaleComponent,
    I18nPipe,
    TreeItemComponent,
    DownloaddialogComponent,
    LogindialogComponent,
    LogoutdialogComponent,
    BrowsedialogComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    QuillModule.forRoot({
      modules: {
        syntax: false, // https://quilljs.com/docs/modules/syntax/
        toolbar: [
          // [{ 'font': [] }],
          // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'script': 'sub' }, { 'script': 'super' }],
          [{ 'align': [] }],
          [{ 'indent': '-1' }, { 'indent': '+1' }],
          [{ 'color': [] }, { 'background': [] }],
          ['link', 'image' ]
        ]
      },
      placeholder: '',
      theme: 'snow'
    }),
    NgbModule,
    NgbCollapseModule,
    NgbDropdownModule,
    NgbModalModule,
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
    MatSlideToggle,
    MatSidenavModule,
    ResizableModule
  ],
  providers: [
    I18nService,
    {
      provide: APP_INITIALIZER,
      useFactory: setupI18nFactory,
      deps: [ I18nService ],
      multi: true
    },
    I18nPipe,
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

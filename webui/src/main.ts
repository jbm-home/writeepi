/// <reference types="@angular/localize" />

import { I18nService } from './app/services/i18n.service.js';
import {
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { I18nPipe } from './app/pipes/i18n.pipe.js';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import {
  withInterceptorsFromDi,
  provideHttpClient,
} from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module.js';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import {
  NgbModule,
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';
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
import { MatSidenavModule } from '@angular/material/sidenav';
import { ResizableDirective } from 'angular-resizable-element';
import { AppComponent } from './app/app.component.js';
import Quill from 'quill';
import Searcher from './app/quill-plugins/searcher.js';
import { ANTIDOTE_AUTO_CONNECT } from './app/services/antidote.service.js';

export function setupI18nFactory(service: I18nService): () => void {
  return () => service.use('en');
}

Quill.register('modules/Searcher', Searcher);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      FormsModule,
      QuillModule.forRoot({
        formats: [],
        modules: {
          syntax: false,
          toolbar: false,
          Searcher: true,
          keyboard: {
            bindings: {
              'list autofill': null,
            },
          },
        },
        placeholder: '',
        theme: 'snow',
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
      MatSidenavModule,
      ResizableDirective,
    ),
    I18nService,
    provideAppInitializer(() => inject(I18nService).use('en')),
    I18nPipe,
    provideHttpClient(withInterceptorsFromDi()),
    { provide: ANTIDOTE_AUTO_CONNECT, useValue: false },
  ],
}).catch((err) => console.error(err));

/// <reference types="@angular/localize" />

import { I18nService } from './app/services/i18n.service.js';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { I18nPipe } from './app/pipes/i18n.pipe.js';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module.js';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { NgbModule, NgbCollapseModule, NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
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
import { ResizableModule } from 'angular-resizable-element';
import { AppComponent } from './app/app.component.js';

export function setupI18nFactory(
    service: I18nService): Function {
    return () => service.use('en');
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, FormsModule, QuillModule.forRoot({
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
                    ['link', 'image']
                ]
            },
            placeholder: '',
            theme: 'snow'
        }), NgbModule, NgbCollapseModule, NgbDropdownModule, NgbModalModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatBadgeModule, MatSnackBarModule, MatListModule, MatIconModule, MatTabsModule, MatSidenavModule, ResizableModule),
        I18nService,
        {
            provide: APP_INITIALIZER,
            useFactory: setupI18nFactory,
            deps: [I18nService],
            multi: true
        },
        I18nPipe,
        provideAnimationsAsync(),
        provideHttpClient(withInterceptorsFromDi())
    ]
})
    .catch(err => console.error(err));

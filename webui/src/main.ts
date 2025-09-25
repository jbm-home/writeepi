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
const icons = Quill.import('ui/icons') as any;
icons['highlight'] = `<svg class="ql-fill" viewBox="0 0 512 512">
<g>
	<g>
		<path d="M509.014,129.214L391.039,11.239c-3.733-3.731-9.693-4-13.747-0.619L106.933,236.192c-2.199,1.835-3.526,4.51-3.655,7.372
			c-0.129,2.862,0.953,5.645,2.977,7.671l11.37,11.37l-30.648,30.587c-1.426,1.423-2.386,3.224-2.784,5.168l-0.002-0.001
			l-1.482,7.217c-7.646,37.235-23.432,73.307-45.65,104.314c-2.908,4.057-2.45,9.623,1.079,13.153l1.475,1.475L2.987,461.143
			c-2.389,2.389-3.439,5.804-2.807,9.123c0.633,3.318,2.868,6.107,5.968,7.449l58.203,25.193c1.306,0.565,2.683,0.839,4.05,0.839
			c2.653,0,5.261-1.035,7.214-2.987l20.12-20.12l1.52,1.52l0.08,0.079c1.971,1.946,4.562,2.943,7.169,2.943
			c2.07,0,4.15-0.628,5.937-1.908c31.144-22.315,66.953-38.177,103.554-45.87l7.679-1.615l-0.002-0.005
			c1.852-0.388,3.62-1.287,5.066-2.714l30.889-30.461l11.389,11.389c1.917,1.916,4.513,2.987,7.211,2.987
			c0.153,0,0.307-0.003,0.46-0.01c2.862-0.129,5.537-1.455,7.373-3.654l225.573-270.359
			C513.013,138.908,512.745,132.946,509.014,129.214z M66.093,481.434l-38.071-16.478l26.013-26.014l27.274,27.274L66.093,481.434z
			 M105.683,461.743l-47.097-47.099c19.143-28.487,33.36-60.579,41.581-93.82l99.056,99.056
			C166.336,428.134,134.336,442.452,105.683,461.743z M219.627,411.433L108.612,300.419l23.437-23.389l111.154,111.154
			L219.627,411.433z M275.548,391.681L128.571,244.705L383.204,32.252l104.795,104.796L275.548,391.681z"/>
	</g>
</g>
</svg>`;
const BackgroundStyle = Quill.import('attributors/style/background') as any;
Quill.register(BackgroundStyle, true);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      FormsModule,
      QuillModule.forRoot({
        formats: ['bold', 'italic', 'underline', 'align', 'background'],
        modules: {
          syntax: false,
          toolbar: {
            container: [
              ['bold', 'italic', 'underline'],
              [
                { align: '' },
                { align: 'center' },
                { align: 'right' },
                { align: 'justify' },
              ],
              ['highlight'],
            ],
            handlers: {
              highlight: function (this: any) {
                const range = this.quill.getSelection();
                if (range) {
                  const currentFormat = this.quill.getFormat(range);
                  if (currentFormat.background === 'yellow') {
                    this.quill.format('background', false);
                  } else {
                    this.quill.format('background', 'yellow');
                  }
                }
              }
            }
          },
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import EN from '../i18n/en';
import FR from '../i18n/fr';
import DE from '../i18n/de';
import ES from '../i18n/es';
import IT from '../i18n/it';
import { AppComponent } from '../app.component';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  data: any = {};
  supportedLanguages: any[] = [
    { code: "en", name: "English", data: EN },
    { code: "fr", name: "Français", data: FR },
    { code: "de", name: "Deutsch", data: DE },
    { code: "es", name: "Español", data: ES },
    { code: "it", name: "Italiano", data: IT },
  ];
  selectedLang: string;

  constructor(private electronService: ElectronService) {
    this.selectedLang = this.getDefaultLang().code;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  getDefaultLang() {
    return this.supportedLanguages[0];
  }

  isSupportedLanguage(lang: string) {
    return this.supportedLanguages.find((sl: any) => sl.code === lang) !== undefined;
  }

  use(lang: string): void {
    const found: any = this.supportedLanguages.find((sl: any) => sl.code === lang);
    if (found === undefined) {
      this.data = this.supportedLanguages[0].data;
    } else {
      this.data = found.data;
    }
  }

  setLang(lang: string) {
    if (!this.isSupportedLanguage(lang)) {
      lang = this.getDefaultLang().code;
    }
    this.selectedLang = lang;
    localStorage.setItem('selectedLang', lang);
    this.use(lang);
    if (!AppComponent.CLOUDMODE) {
      this.electronService.api.setLang(lang);
    }
  }
}

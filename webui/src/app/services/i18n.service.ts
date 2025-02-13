import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import EN from '../i18n/en.js';
import FR from '../i18n/fr.js';
import DE from '../i18n/de.js';
import ES from '../i18n/es.js';
import IT from '../i18n/it.js';
import { AppComponent } from '../app.component.js';
import { ElectronService } from './electron.service.js';

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  data: any = {};
  supportedLanguages: LangData[] = [
    { code: "en", name: "English", data: EN, iso: "en-US" },
    { code: "fr", name: "Français", data: FR, iso: "fr-FR" },
    { code: "de", name: "Deutsch", data: DE, iso: "de-DE" },
    { code: "es", name: "Español", data: ES, iso: "es-ES" },
    { code: "it", name: "Italiano", data: IT, iso: "it-IT" },
  ];
  selectedLang: string;
  currentLangFullData: LangData;

  constructor(private electronService: ElectronService) {
    this.currentLangFullData = this.getDefaultLang();
    this.selectedLang = this.currentLangFullData.code;
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
      this.currentLangFullData = this.supportedLanguages[0];
    } else {
      this.data = found.data;
      this.currentLangFullData = found;
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

export interface LangData {
  code: string;
  name: string;
  data: any;
  iso: string;
}
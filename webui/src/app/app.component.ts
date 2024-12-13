import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ElectronService } from './services/electron.service';
import { EditorService } from './services/editor.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { I18nService } from './services/i18n.service';
import { I18nPipe } from './pipes/i18n.pipe';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

// TODO: mode hors ligne utilise uniquement electron avec le json (projet hors ligne
// TODO: reprise du login sans perdre le contenu en ligne (projet en ligne)

export class AppComponent implements OnInit, OnDestroy {
  notifications = [];
  darkMode = false;

  @HostListener("click") onClick(event: any) {
    this.editorService.closeAllContexts();
  }

  @HostListener("window:beforeunload", ["$event"]) unloadHandler(event: Event) {
    if (this.editorService.loadedProject?.settings.backupOnChange) {
      this.editorService.backup(this.editorService.loadedProject?.settings.backupAutoDisplayMessage);
    }
    event.preventDefault();
  }

  @HostListener('document:keydown.control.s', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    event.preventDefault();
    this.editorService.backup(true);
  }

  constructor(
    private i18n: I18nService,
    private i18nPipe: I18nPipe,
    private electronService: ElectronService,
    public editorService: EditorService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar) {
      this.setThemeMode();
  }

  ngOnInit(): void {
    this.loadStorageLang();
    this.editorService.startAutoBackup();
    this.loadAll();
  }

  setThemeMode() {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    this.switchDarkMode(matchMedia.matches ? 'dark' : 'light');

    matchMedia.addEventListener('change', e => {
      const match = e.matches;
      this.switchDarkMode(match ? 'dark' : 'light');
    });
  }

  switchDarkMode(theme: string) {
    document.body.setAttribute('data-bs-theme', theme);
    document.body.className = theme === 'dark' ? 'darkMode' : '';
    this.darkMode = theme === 'dark';
  }

  async toggleDarkMode() {
    await this.electronService.api.darkModeToggle(this.darkMode ? 'light' : 'dark');
    this.setThemeMode()
  }

  loadStorageLang() {
    let lang: string = localStorage.getItem('selectedLang') ?? navigator.language.slice(0, 2);
    if (lang.length > 0) {
      this.setLang(lang);
    }
  }

  getDisplayedSubscribeLevel(role: string) {
    switch (role) {
      case 'GUEST':
        return 'No subscription';
      case 'CLOUD':
        return 'Cloud';
      case 'CLOUDPLUS':
        return 'Cloud+';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'No subscription';
    }
  }

  getI18nForKey(key: string) {
    return this.i18nPipe.transform(key);
  }

  setLang(lang: string) {
    if (!this.i18n.isSupportedLanguage(lang)) {
      lang = this.i18n.getDefaultLang().code;
    }
    this.i18n.selectedLang = lang;
    localStorage.setItem('selectedLang', lang);
    this.i18n.use(lang);
    this.electronService.api.setLang(lang);
  }

  ngOnDestroy(): void {
    //
  }

  async loadAll() {
    await this.editorService.listAllProjects();
  }
}

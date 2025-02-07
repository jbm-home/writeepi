import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ElectronService } from './services/electron.service.js';
import { EditorService } from './services/editor.service.js';
import { MatDialog } from '@angular/material/dialog';
import { I18nService } from './services/i18n.service.js';
import { I18nPipe } from './pipes/i18n.pipe.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LogindialogComponent } from './dialogs/logindialog/logindialog.component.js';
import { LogoutdialogComponent } from './dialogs/logoutdialog/logoutdialog.component.js';
import { SessionService } from './services/session.service.js';
import { User } from '../../../server/src/types/user.js';
import { SharedModule } from './shared.module.js';
import { TreeItemComponent } from './tree-item/tree-item.component.js';

@Component({
  selector: 'app-root',
  imports: [SharedModule, TreeItemComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit, OnDestroy {
  public static CLOUDMODE = false;

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
    public i18n: I18nService,
    private i18nPipe: I18nPipe,
    private electronService: ElectronService,
    public editorService: EditorService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public sessionService: SessionService) {
    AppComponent.CLOUDMODE = !this.electronService.isElectronApp;
    this.setThemeMode();
  }

  ngOnInit(): void {
    this.loadStorageLang();

    if (AppComponent.CLOUDMODE) {
      this.loadUser();
    } else {
      this.loadAll();
    }

    this.editorService.startAutoBackup();
  }

  get cloudMode() {
    return AppComponent.CLOUDMODE;
  }

  setThemeMode() {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkMode = matchMedia.matches;
    this.switchDarkMode(this.darkMode ? 'dark' : 'light');

    matchMedia.addEventListener('change', e => {
      const match = e.matches;
      this.darkMode = match;
      this.switchDarkMode(this.darkMode ? 'dark' : 'light');
    });
  }

  switchDarkMode(theme: string) {
    document.body.setAttribute('data-bs-theme', theme);
    document.body.className = theme === 'dark' ? 'darkMode' : '';
    this.darkMode = theme === 'dark';
  }

  async toggleDarkMode() {
    if (!AppComponent.CLOUDMODE) {
      await this.electronService.api.darkModeToggle(this.darkMode ? 'light' : 'dark');
    }
    // TODO: fix me on cloud version
    //this.switchDarkMode(this.darkMode ? 'light' : 'dark');
  }

  loadStorageLang() {
    let lang: string = localStorage.getItem('selectedLang') ?? navigator.language.slice(0, 2);
    if (lang.length > 0) {
      this.i18n.setLang(lang);
    }
  }

  getI18nForKey(key: string) {
    return this.i18nPipe.transform(key);
  }

  ngOnDestroy(): void {
    //
  }

  async loadAll() {
    await this.editorService.listAllProjects();
  }

  loginUser(login: string, password: string) {
    this.sessionService.loginUser(login, password).then((data: any) => {
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      this.loadUser();
    }, (error: any) => {
      this.openLoginModal();
      this.snackBar.open(`Login error`, 'Close', { duration: 2000 });
    });
  }

  loadUser() {
    this.sessionService.getUserInfos().then((data: User) => {
      this.sessionService.connected = data?.level !== undefined && Number.isInteger(data.level) && data.level > 0;
      if (this.sessionService.connected) {
        this.sessionService.userInfo = { email: data.email, level: data.level, fullname: data.firstname + ' ' + data.lastname, uid: data.uuid };
        this.snackBar.open(`Welcome ${this.sessionService.userInfo.fullname}`, 'Close', { duration: 2000 });
        this.loadAll();
      }
    }, (error: any) => {
      this.sessionService.connected = false;
      this.sessionService.userInfo = {
        email: '',
        level: 0,
        fullname: '',
        uid: ''
      };
      this.editorService.resetAll();
      this.openLoginModal();
    });
  }

  openLoginModal() {
    const dialogRef = this.dialog.open(LogindialogComponent, {
      width: '450px',
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result.validated) {
        if (result.data !== undefined && result.data !== undefined) {
          if (result.data.login !== undefined && result.data.password !== undefined) {
            const login = String(result.data.login);
            const password = String(result.data.password);
            if (login.length > 0 && password.length > 0) {
              this.loginUser(login, password);
              return;
            }
          }
        }
        this.snackBar.open(`Cannot login`, 'Close', { duration: 2000 });
      }
      this.openLoginModal();
    });
  }

  openLogoutModal() {
    const dialogRef = this.dialog.open(LogoutdialogComponent, {
      width: '300px',
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result.validated) {
        this.sessionService.logout().then((data: any) => {
          this.snackBar.open(`Logged out`, 'Close', { duration: 2000 });
          localStorage.removeItem('authToken');
          this.loadUser();
        });
      }
    });
  }
}

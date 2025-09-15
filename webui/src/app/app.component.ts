import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { RegisterdialogComponent } from './dialogs/registerdialog/registerdialog.component.js';
import { TextToSpeechService } from './services/textToSpeech.service.js';
import { SpeechdialogComponent } from './dialogs/speechdialog/speechdialog.component.js';
import { WordStatsTableComponent } from './word-stats-table/word-stats-table.component.js';
import { AntidoteService } from './services/antidote.service.js';

@Component({
  selector: 'app-root',
  imports: [SharedModule, TreeItemComponent, WordStatsTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('searchInputRef') searchInputRef!: ElementRef<HTMLInputElement>;
  public static CLOUDMODE = false;

  notifications = [];
  darkMode = false;
  fullversion: string = '';
  showSearch = false;
  searchInput = '';

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

  @HostListener('document:keydown.meta.s', ['$event']) onCmdS(event: KeyboardEvent) {
    event.preventDefault();
    this.editorService.backup(true);
  }

  @HostListener('document:keydown.control.f', ['$event']) onCtrlF(event: KeyboardEvent) {
    event.preventDefault();
    !this.showSearch && this.toggleSearch();
  }

  @HostListener('document:keydown.meta.f', ['$event']) onCmdF(event: KeyboardEvent) {
    event.preventDefault();
    !this.showSearch && this.toggleSearch();
  }

  @HostListener('document:keydown.control.j', ['$event']) onCtrlJ(event: KeyboardEvent) {
    event.preventDefault();
    this.editorService.exportJEFormat();
  }

  @HostListener('document:keydown.meta.j', ['$event']) onCmdJ(event: KeyboardEvent) {
    event.preventDefault();
    this.editorService.exportJEFormat();
  }

  constructor(
    public i18n: I18nService,
    private i18nPipe: I18nPipe,
    private electronService: ElectronService,
    public editorService: EditorService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public sessionService: SessionService,
    private antidote: AntidoteService,
    public tts: TextToSpeechService) {
    AppComponent.CLOUDMODE = !this.electronService.isElectronApp;
    this.setThemeMode();
  }

  ngOnInit(): void {
    this.loadStorageLang();
    this.setFullVersion().then((value) => { this.fullversion = value; });
    this.tts.listAllVoices();

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

  // TODO
  checkText(text: string) {
    this.antidote.getCorrections(text)
      .then(resp => console.log('From antidote', resp))
      .catch(err => console.error('Error', err));
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

  speech() {
    if (this.tts.isSpeaking()) {
      this.tts.stop();
    } else {
      const dialogRef = this.dialog.open(SpeechdialogComponent, {
        width: '450px',
        enterAnimationDuration: 250,
        exitAnimationDuration: 250,
        data: {}
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!!result) {
          const selectedText = this.editorService.getSelectedTextOrUndefined();
          this.tts.start(selectedText !== undefined && selectedText.length > 0 ? selectedText : this.editorService.getEditorText());
        }
      });
    }
  }

  async setFullVersion(): Promise<string> {
    if (!AppComponent.CLOUDMODE) {
      return 'Writeepi Desktop ' + await this.electronService.api.version();
    } else {
      const version: string = await this.sessionService.version();
      return 'Writeepi Cloud ' + version;
    }
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
      if (data?.error !== undefined) {
        this.openLoginModal();
        this.snackBar.open(`Login error: ${data.error}`, 'Close', { duration: 2000 });
      } else {
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        this.loadUser();
      }
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
        if (result.register === true) {
          this.openRegisterModal();
          return;
        } else if (result.data !== undefined) {
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

  openRegisterModal() {
    const dialogRef = this.dialog.open(RegisterdialogComponent, {
      width: '450px',
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result.validated) {
        if (result.login === true) {
          this.openLoginModal();
          return;
        }
        this.snackBar.open(`Cannot register`, 'Close', { duration: 2000 });
      }
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

  onResizeEnd(event: any) {
    const root = document.documentElement;

    const currentSidebar = parseFloat(
      getComputedStyle(root).getPropertyValue('--sidebarwidth')
    );
    const currentRightbar = parseFloat(
      getComputedStyle(root).getPropertyValue('--rightbarwidth')
    );

    if (event?.edges?.left !== undefined) {
      const newSidebar = currentSidebar + event.edges.left;
      root.style.setProperty('--sidebarwidth', `${newSidebar > 20 ? newSidebar : 20}px`);
      if (this.editorService.loadedProject?.settings) {
        this.editorService.loadedProject.settings.leftbar = newSidebar;
      }
    }

    if (event?.edges?.right !== undefined) {
      const newRightbar = currentRightbar - event.edges.right;
      root.style.setProperty('--rightbarwidth', `${newRightbar > 20 ? newRightbar : 20}px`);
      if (this.editorService.loadedProject?.settings) {
        this.editorService.loadedProject.settings.rightbar = newRightbar;
      }
    }
  }

  toggleSearch() {
    this.searchInput = '';
    this.editorService.searchModule?.clear();
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => {
        this.searchInputRef?.nativeElement.focus();
      });
    }
  }

  searchInEditor() {
    this.editorService.searchModule?.highlight(this.searchInput);
  }
}

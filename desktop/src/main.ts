import { app, BrowserWindow, ipcMain, screen, nativeTheme } from 'electron';
import Store from 'electron-store';
import { fileURLToPath } from "url";
import path from "path";
import contextMenu from 'electron-context-menu';
import { PdfExporter } from './services/pdfExporter.js';
import { Project } from './services/project.js';
import { EpubExporter } from './services/epubExporter.js';
import { DocxExporter } from './services/docxExporter.js';
import { Thes } from './services/thes.js';

export class WriteepiDesktop {
  mainWindow: BrowserWindow | null = null;

  project: Project = new Project(this);
  pdfExporter: PdfExporter = new PdfExporter(this);
  epubExporter: EpubExporter = new EpubExporter(this);
  docxExporter: DocxExporter = new DocxExporter(this);
  thes: Thes = new Thes(this);

  mainstore: Store = new Store({ name: 'writeepi', cwd: this.project.loadCustomConfig() });
  backstore: Store = new Store({ name: 'writeepi-backup', cwd: this.project.loadCustomConfig() });

  init() {
    app.on('ready', this.createWindow);
    app.on('window-all-closed', this.onWindowAllClosed);

    ipcMain.handle('save-backup', this.project.handleSaveBackup);
    ipcMain.handle('load-backup', this.project.handleLoadBackup);
    ipcMain.handle('list-backup', this.project.handleListBackup);
    ipcMain.handle('store-location', this.project.handleChangeStoreLocation);
    ipcMain.handle('export', this.project.handleExport);
    ipcMain.handle('new-guid', this.project.handleNewGuid);
    ipcMain.handle('build-pdf', this.pdfExporter.handleBuildPdf);
    ipcMain.handle('build-epub', this.epubExporter.handleBuildEpub);
    ipcMain.handle('build-docx', this.docxExporter.handleBuildDocx);
    ipcMain.handle('create-project', this.project.handleCreateProject);
    ipcMain.handle('darkmode-toggle', this.handleDarkModeToggle);
    ipcMain.handle('set-lang', this.thes.setLang);
  }

  createWindow = () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const size = screen.getPrimaryDisplay().workAreaSize;
    contextMenu({
      showInspectElement: false,
      append: (defaultActions, parameters, browserWindow) => [
        {
          label: 'Thesaurus "{selection}"',
          // Only show it when right-clicking text
          visible: parameters.selectionText.trim().length > 0,
          click: () => {
            this.thes.handleSearch({}, parameters.selectionText.trim());
          }
        }
      ]
    });
    this.mainWindow = new BrowserWindow({
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, "preload.mjs"),
      },
      icon: path.join(__dirname, 'favicon.png')
    });
    const url = new URL(path.join('file:', __dirname, '../../webui/browser/index.html'));
    this.mainWindow.loadURL(url.href);
    this.mainWindow.setMenu(null);
    this.mainWindow.on('close', (e) => {
      e.preventDefault();
      this.mainWindow?.destroy();
    });
  }

  onWindowAllClosed = () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  handleDarkModeToggle = (event: any, theme: string) => {
    nativeTheme.themeSource = theme === 'dark' ? 'dark' : 'light';
    return nativeTheme.shouldUseDarkColors
  }
}

const main = new WriteepiDesktop();
main.init();
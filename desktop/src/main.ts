import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  nativeTheme,
  dialog,
} from "electron";
import Store from "electron-store";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import contextMenu from "electron-context-menu";
import { Project } from "./services/project.js";
import { PdfExporter } from "./services/pdfExporter.js";
import { EpubExporter } from "./services/epubExporter.js";
import { DocxExporter } from "./services/docxExporter.js";
import { Thes } from "./services/thes.js";
import { APP_VERSION } from "./version.js";
import squirrelStartup from "electron-squirrel-startup";

export class WriteepiDesktop {
  mainWindow: BrowserWindow | null = null;

  project: Project = new Project(this);
  pdfExporter: PdfExporter = new PdfExporter(this);
  epubExporter: EpubExporter = new EpubExporter(this);
  docxExporter: DocxExporter = new DocxExporter(this);
  thes: Thes = new Thes(this);

  mainstore: Store = new Store({
    name: "writeepi",
    cwd: this.project.loadCustomConfig(),
  });
  backstore: Store = new Store({
    name: "writeepi-backup",
    cwd: this.project.loadCustomConfig(),
  });

  isFirstRun = process.argv.includes("--squirrel-firstrun");

  init() {
    if (process.platform === "win32" && squirrelStartup) {
      app.quit();
      return;
    } else if (this.isFirstRun) {
      app.on("ready", this.createInstallationConfirmationWindow);
      app.on("window-all-closed", this.onFirstRunDone);
      return;
    }
    app.on("ready", this.createWindow);
    app.on("window-all-closed", this.onWindowAllClosed);
    app.on("activate", this.onActivate);

    ipcMain.handle("save-backup", this.project.handleSaveBackup);
    ipcMain.handle("load-backup", this.project.handleLoadBackup);
    ipcMain.handle("save-cover", this.project.handleSaveCover);
    ipcMain.handle("load-cover", this.project.handleLoadCover);
    ipcMain.handle("list-backup", this.project.handleListBackup);
    ipcMain.handle("store-location", this.project.handleChangeStoreLocation);
    ipcMain.handle("export", this.project.handleExport);
    ipcMain.handle("new-guid", this.project.handleNewGuid);
    ipcMain.handle("build-pdf", this.pdfExporter.handleBuildPdf);
    ipcMain.handle("build-epub", this.epubExporter.handleBuildEpub);
    ipcMain.handle("build-docx", this.docxExporter.handleBuildDocx);
    ipcMain.handle("create-project", this.project.handleCreateProject);
    ipcMain.handle("darkmode-toggle", this.handleDarkModeToggle);
    ipcMain.handle("set-lang", this.thes.setLang);
    ipcMain.handle("version", this.handleVersion);
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
          },
        },
      ],
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
      icon: path.join(__dirname, "favicon.png"),
    });
    const indexPath = path.join(__dirname, "../../webui/browser/index.html");
    const url = pathToFileURL(indexPath);
    this.mainWindow.loadURL(url.href);
    this.mainWindow.setMenu(null);
    this.mainWindow.on("close", (e) => {
      e.preventDefault();
      this.mainWindow?.destroy();
      this.mainWindow = null;
    });
    // this.mainWindow.webContents.openDevTools();
  };

  createInstallationConfirmationWindow = async () => {
    const mainWindow = new BrowserWindow({
      width: 0,
      height: 0,
      show: false,
    });
    await dialog.showMessageBox(mainWindow!, {
      type: "info",
      buttons: ["OK"],
      defaultId: 0,
      title: "Installation Successful",
      message: "Writeepi has been installed successfully.",
    });
    app.emit("window-all-closed");
  };

  onWindowAllClosed = () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  };

  onFirstRunDone = () => {
    app.quit();
  };

  onActivate = () => {
    if (this.mainWindow) {
      this.mainWindow.show();
    } else {
      this.createWindow();
    }
  };

  handleDarkModeToggle = (event: any, theme: string) => {
    nativeTheme.themeSource = theme === "dark" ? "dark" : "light";
    return nativeTheme.shouldUseDarkColors;
  };

  handleVersion = (event: any) => {
    return APP_VERSION;
  };
}

const main = new WriteepiDesktop();
main.init();

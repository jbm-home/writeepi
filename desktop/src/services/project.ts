import { app, dialog } from "electron";
import { WriteepiDesktop } from "../main.js";
import Store from 'electron-store';
import { UserProject } from "../../../webui/src/app/types/userproject.js";
import { DefaultProject } from "../../../webui/src/app/types/defaultproject.js"
import { existsSync, writeFileSync } from 'original-fs';
import { uuidv7 } from "uuidv7"
import { createHash } from "crypto"

export class Project {
  desktop: WriteepiDesktop;

  constructor(desktop: WriteepiDesktop) {
    this.desktop = desktop;
  }


  handleChangeStoreLocation = async (event: any) => {
    if (this.desktop.mainWindow != null) {
      let result = await dialog.showOpenDialog(this.desktop.mainWindow, { properties: ['createDirectory', 'openDirectory'] });
      if (!result.canceled && result.filePaths != undefined && result.filePaths.length > 0 && result.filePaths[0] !== undefined) {
        if (existsSync(result.filePaths[0])) {
          this.desktop.mainstore = new Store({ name: 'writeepi', cwd: result.filePaths[0] });
          this.desktop.backstore = new Store({ name: 'writeepi-backup', cwd: result.filePaths[0] });
          this.saveCustomConfig(result.filePaths[0]);
          return true;
        }
      }
    }
    return false;
  }

  handleExport = async (event: any, data: any) => {
    if (this.desktop.mainWindow != null) {
      let result = await dialog.showSaveDialog(this.desktop.mainWindow, {});
      if (!result.canceled && result.filePath != null) {
        writeFileSync(result.filePath, JSON.stringify(data), {
          flag: "w"
        });
        return { status: true };
      }
    }
    return { status: false, error: 'File has not been saved' };
  }

  handleSaveBackup = async (event: any, data: UserProject) => {
    try {
      // normal backup
      let backup = this.desktop.mainstore.get('current') as UserProject[];
      if (backup === undefined) {
        backup = [];
      }
      const previousBackup = backup.find((elem) => elem.id === data.id);
      backup = backup.filter((elem) => elem.id !== data.id);
      data.updatedAt = (new Date()).toISOString();
      data.updatedTimestamp = Date.now();
      backup.push(data);
      if (backup.length > 10) {
        backup.shift();
      }
      this.desktop.mainstore.set('current', backup);

      // optional backup
      let optBackup = this.desktop.backstore.get('backup') as UserProject[];
      const lastBackup = optBackup.sort((elem1, elem2) => {
        const elem1Ts = elem1.updatedTimestamp !== undefined ? elem1.updatedTimestamp : 0;
        const elem2Ts = elem2.updatedTimestamp !== undefined ? elem2.updatedTimestamp : 0;
        return elem2Ts - elem1Ts;
      }).find((elem) => elem.id === data.id);
      if (optBackup === undefined) {
        optBackup = [];
      }
      if (previousBackup !== undefined) {
        if (lastBackup === undefined || lastBackup.updatedTimestamp === undefined || Date.now() > lastBackup.updatedTimestamp + 600000) {
          optBackup.push(previousBackup);
          if (optBackup.length > 50) {
            optBackup.shift();
          }
          this.desktop.backstore.set('backup', optBackup);
        }
      }

      if (!(await this.backupIntegrity(data))) {
        dialog.showErrorBox('Backup error', 'Integrity check failed');
      }

      return data.id;
    } catch (e: any) {
      return undefined;
    }
  }

  handleListBackup = async (event: any) => {
    try {
      let backup = this.desktop.mainstore.get('current') as UserProject[];
      if (backup === undefined || backup.length === 0) {
        return [];
      } else {
        return backup.sort((elem1, elem2) => {
          const elem1Ts = elem1.updatedTimestamp !== undefined ? elem1.updatedTimestamp : 0;
          const elem2Ts = elem2.updatedTimestamp !== undefined ? elem2.updatedTimestamp : 0;
          return elem2Ts - elem1Ts;
        });
      }
    } catch (e) {
      return [];
    }
  }

  handleLoadBackup = async (event: any, id: string) => {
    try {
      let backup = this.desktop.mainstore.get('current') as any[];
      if (backup === undefined || backup.length === 0) {
        return DefaultProject.DEFAULT_PROJECT;
      } else {
        const candidate = backup.find((elem) => elem.id === id)
        return candidate !== undefined ? candidate : DefaultProject.DEFAULT_PROJECT;
      }
    } catch (e) {
      return DefaultProject.DEFAULT_PROJECT;
    }
  }

  loadCustomConfig() {
    const defaultStore = new Store({ name: 'config' });
    let customConf = defaultStore.get('location') as string;
    if (customConf === undefined) {
      const location = app.getPath('userData');
      defaultStore.set('location', location);
      return location;
    } else {
      return customConf;
    }
  }

  saveCustomConfig(path: string) {
    const defaultStore = new Store({ name: 'config' });
    defaultStore.set('location', path);
  }

  handleCreateProject = async (event: any, data: UserProject) => {
    return DefaultProject.DEFAULT_PROJECT;
  }

  handleNewGuid = async (event: any) => {
    return { guid: uuidv7() };
  }

  private async backupIntegrity(backup: UserProject) {
    const latest = await this.handleLoadBackup({}, backup.id);
    const md5ToCompare = createHash('md5').update(JSON.stringify(backup.content)).digest("hex");
    const md5Latest = createHash('md5').update(JSON.stringify(latest.content)).digest("hex");
    return md5ToCompare === md5Latest;
  }
}
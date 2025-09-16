import { Injectable } from '@angular/core';
import * as Electron from 'electron';

export interface ElectronWindow extends Window {
  require(module: string): Electron.BrowserWindow;
  electronAPI: any;
}

declare let window: ElectronWindow;

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  public get api(): any {
    return window.electronAPI;
  }

  public get isElectronApp(): boolean {
    return !!window.navigator.userAgent.match(/Electron/);
  }

  public get isMacOS(): boolean {
    return this.isElectronApp && process.platform === 'darwin';
  }

  public get isWindows(): boolean {
    return this.isElectronApp && process.platform === 'win32';
  }

  public get isLinux(): boolean {
    return this.isElectronApp && process.platform === 'linux';
  }

  public get isX86(): boolean {
    return this.isElectronApp && process.arch === 'ia32';
  }

  public get isX64(): boolean {
    return this.isElectronApp && process.arch === 'x64';
  }

  public get isArm(): boolean {
    return this.isElectronApp && process.arch === 'arm';
  }
}

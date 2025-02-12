import { contextBridge, ipcRenderer }from 'electron';
import { UserProject } from '../../webui/src/app/types/userproject.js';

contextBridge.exposeInMainWorld('electronAPI', {
    saveBackup: (data: UserProject) => ipcRenderer.invoke('save-backup', data),
    loadBackup: (id: string) => ipcRenderer.invoke('load-backup', id),
    listBackup: () => ipcRenderer.invoke('list-backup'),
    createProject: (data: UserProject) => ipcRenderer.invoke('create-project', data),
    export: (data: any) => ipcRenderer.invoke('export', data),
    buildPdf: (id: string) => ipcRenderer.invoke('build-pdf', id),
    buildEpub: (id: string) => ipcRenderer.invoke('build-epub', id),
    buildDocx: (id: string) => ipcRenderer.invoke('build-docx', id),
    newGuid: () => ipcRenderer.invoke('new-guid'),
    storeLocation: () => ipcRenderer.invoke('store-location'),
    darkModeToggle: (theme: string) => ipcRenderer.invoke('darkmode-toggle', theme),
    setLang: (lang: string) => ipcRenderer.invoke('set-lang', lang),
    version: () => ipcRenderer.invoke('version'),
})
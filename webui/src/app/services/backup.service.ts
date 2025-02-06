import { Injectable } from '@angular/core';
import axios from 'axios';
import { UserProject } from '../types/userproject';
import { AppComponent } from '../app.component';
import { ElectronService } from './electron.service';

@Injectable({
    providedIn: 'root'
})
export class BackupService {
    constructor(private electronService: ElectronService) { }

    async saveBackup(project: UserProject) {
        if (AppComponent.CLOUDMODE) {
            return await axios.post('/api/content', project);
        } else {
            return await this.electronService.api.saveBackup(project);
        }
    }

    async loadBackup(id: string) {
        if (AppComponent.CLOUDMODE) {
            return await axios.get('/api/content/' + id);
        } else {
            return await this.electronService.api.loadBackup(id);
        }
    }

    async listBackup() {
        if (AppComponent.CLOUDMODE) {
            return await axios.get('/api/content');
        } else {
            return await this.electronService.api.listBackup();
        }
    }

    async createProject() {
        if (AppComponent.CLOUDMODE) {
            return await axios.post('/api/content/create');
        } else {
            return await this.electronService.api.createProject();
        }
    }

    async openStoreLocation() {
        return await this.electronService.api.storeLocation();
    }
}

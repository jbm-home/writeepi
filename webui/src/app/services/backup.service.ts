import { Injectable } from '@angular/core';
import axios from 'axios';
import { Period, UserProject, WordStats } from '../types/userproject.js';
import { AppComponent } from '../app.component.js';
import { ElectronService } from './electron.service.js';

@Injectable({
  providedIn: 'root',
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

  async getStats(stats: WordStats, period: Period) {
    if (AppComponent.CLOUDMODE) {
      return {};
    } else {
      return await this.electronService.api.getStats(stats, period);
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

  async saveCover(projectId: string, data: string) {
    if (AppComponent.CLOUDMODE) {
      return await axios.post('/api/content/cover', { id: projectId, data });
    } else {
      // TODO
      return undefined;
    }
  }

  async getCover(projectId: string): Promise<{ cover: string; } | undefined> {
    if (AppComponent.CLOUDMODE) {
      return await axios.get(`/api/content/cover/${projectId}`);
    } else {
      // TODO
      return undefined;
    }
  }

  async openStoreLocation() {
    return await this.electronService.api.storeLocation();
  }
}

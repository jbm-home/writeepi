import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModaleComponent } from '../modal/modal.component.js';
import { Content, UserProject, WordStats } from "../types/userproject.js";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DownloaddialogComponent } from '../dialogs/downloaddialog/downloaddialog.component.js';
import Quill from 'quill';
import Delta from 'quill-delta'
import { UuidUtils } from "../../../../server/src/utils/uuidutils.js"
import { BrowsedialogComponent } from '../dialogs/browsedialog/browsedialog.component.js';
import { Failover } from '../utils/failover.js';
import { I18nService } from './i18n.service.js';
import { BackupService } from './backup.service.js';
import Searcher from '../quill-plugins/searcher.js';
import { cleanQuillHtmlToParagraphs } from '../utils/cleanQuill.js';

export class ModalAction {
  key: string = '';
  description: string = '';
}

export class ModalActions {
  rename = { key: 'RENAME', description: 'Rename element' };
  addChildFolder = { key: 'ADDCHILDFOLDER', description: 'Add a child folder' };
  addChildEditor = { key: 'ADDCHILDEDITOR', description: 'Add a child editor' };
  addFolderAfter = { key: 'ADDFOLDERAFTER', description: 'Add a folder after' };
  addFolderBefore = { key: 'ADDFOLDERBEFORE', description: 'Add a folder before' };
  addEditorAfter = { key: 'ADDEDITORAFTER', description: 'Add an editor after' };
  addEditorBefore = { key: 'ADDEDITORBEFORE', description: 'Add an editor before' };
  delete = { key: 'DELETE', description: 'Delete this element' };
  emptyTrash = { key: 'EMPTYTRASH', description: 'Empty trash' };
  moveTop = { key: 'MOVETOP', description: 'Move top' };
  moveBottom = { key: 'MOVEBOTTOM', description: 'Move bottom' };
}

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private modalService = inject(NgbModal);

  modalActions: ModalActions = new ModalActions();

  quill?: Quill = undefined;
  editorEnable: boolean = false;
  searchModule?: Searcher = undefined;

  editor: string = '';
  notes: string = '';

  currentSelectedInTree?: string = undefined; // keep me
  currentBackupUuid: string = ''; // keep me

  globalWordsCount: number = 0;
  globalCharsCount: number = 0;
  globalWordsPct: number = 0;

  showSettings = false;
  showStats = false;
  hasOpenningQuote = false;
  lastBackupAt = 0;

  loadedProject?: UserProject;

  DEFAULT_CHARACTER_DATA = {
    name: '',
    age: '',
    location: '',
    details: '',
    background: '',
    relation: '',
    personality: '',
    appearance: '',
    notes: '',
  };

  currentCharacterData = this.DEFAULT_CHARACTER_DATA;

  characterTemplate = "<p><strong>Character: Name</strong></p><p>x years, location</p><p></p>"
    + "<p><strong>Details:</strong></p><p><strong>some details about character</strong></p><p></p>"
    + "<p><strong>Relationships:</strong></p><p></p><p></p><p><strong>Personality:</strong></p><p></p><p></p><p>"
    + "<strong>Appearance:</strong></p><p></p><p></p><p><strong>Background:</strong></p><p></p><p></p><p><strong>Notes:</strong></p><p></p>";

  constructor(private i18n: I18nService,
    private backupService: BackupService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  startAutoBackup() {
    setInterval(() => {
      const now = Date.now();
      if (this.loadedProject?.settings.backupInterval && now > (this.lastBackupAt + 120000)) {
        this.backup(this.loadedProject?.settings.backupAutoDisplayMessage);
      }
    }, 30000);
  }

  wordCount() {
    const text = this.quill?.getText();
    const trimmed = text?.trim();
    let words: string[] = trimmed !== undefined && trimmed.length > 0 ? trimmed.split(/\s+|'+|-+/) : []; // or /\s+|'+/ if peut-etre count as only one word
    const count = words.filter((w: string) => /[A-Za-zÀ-ÖØ-öø-ÿ0-9]/i.test(w)).length;
    const uc = this.getCurrentSelectedUserContent();
    if (uc !== undefined) {
      uc.words = !uc.isFolder && !uc.isCharacter ? count : 0;
      return uc.words;
    }
    return 0;
  }

  initialize(quill: any) {
    this.quill = quill;
    this.searchModule = this.quill?.getModule('Searcher') as Searcher;
    quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node: any, delta: any) => {
      delta.forEach((e: any) => {
        if (e.insert?.image !== undefined) {
          e.insert = '';
        }
        if (e.attributes !== undefined) {
          e.attributes = undefined;
        }
      });
      return delta;
    });
  }

  contentChanged(event: any) {
    if (event.delta?.ops !== undefined) {
      const ops = event.delta.ops;
      if (ops.length === 1 && ops[0].insert !== undefined) {
        // console.log("Ajout au début du texte de : " + ops[0].insert);
        const insert: string = ops[0].insert;
        if (insert.length === 1) {
          this.checkCharacterForReplace(insert, 0);
        }
      } else if (ops.length === 1 && ops[0].delete !== undefined) {
        // console.log("Suppression de text au début : " + ops[0].delete + " premiers caractères");
      } else if (ops.length > 1 && ops[0].retain !== undefined && ops[1].insert !== undefined) {
        // console.log("Ajout au milieu du texte de : " + ops[1].insert + " en position " + ops[0].retain);
        const insert: string = ops[1].insert;
        if (insert.length === 1 && ops[0].retain > 0) {
          this.checkCharacterForReplace(insert, ops[0].retain);
        }
      } else if (ops.length > 1 && ops[0].retain !== undefined && ops[1].delete !== undefined) {
        // console.log("Suppression de text : " + ops[1].delete + " caractère en position " + ops[0].retain);
      } else {
        // console.log('non géré');
        // console.log(ops);
      }
    }
  }

  getEditorText() {
    return this.quill !== undefined ? this.quill.getText() : '';
  }

  getSelectedTextOrUndefined() {
    if (this.quill !== undefined) {
      const range = this.quill.getSelection();
      if (range != null && range !== undefined) {
        return this.quill.getText(range);
      }
    }
    return undefined;
  }

  checkCharacterForReplace(character: string, position: number) {
    const q = this.quill;
    if (!q) return;

    if (this.loadedProject?.settings.dashConf && character === "-") {
      if (position > 0 && q.getText(position - 1, 1) === '-') {
        // @ts-ignore
        const delta = new Delta();
        const ops = delta.retain(position - 1).insert('— ').delete(2);
        q.updateContents(ops);
      }
    } else if (this.loadedProject?.settings.spaceConf && character === " ") {
      if (position > 0 && q.getText(position - 1, 1) === ' ') {
        // @ts-ignore
        const delta = new Delta();
        const ops = delta.retain(position - 1).insert('. ').delete(2);
        q.updateContents(ops);
      }
    } else if (this.loadedProject?.settings.apostropheConf && character === "'") {
      if (position >= 0 && q) {
        // @ts-ignore
        const delta = new Delta();
        const ops = delta.retain(position).insert('’').delete(1);
        q.updateContents(ops);
      }
    } else if (this.loadedProject?.settings.ellipsisConf && character === ".") {
      if (position > 1 && q.getText(position - 2, 2) === '..') {
        // @ts-ignore
        const delta = new Delta();
        const ops = delta.retain(position - 2).insert('…').delete(3);
        q.updateContents(ops);
        q.once('editor-change', () => {
          q.setSelection(position - 1, 0);
        });
      }
    } else if (this.loadedProject?.settings.quoteConf) {
      if (character === "<" && position > 0 && q.getText(position - 1, 1) === '<') {
        // @ts-ignore
        const delta = new Delta();
        const ops = delta.retain(position - 1).insert('« ').delete(2);
        q.updateContents(ops);
      } else if (character === ">" && position > 0 && q.getText(position - 1, 1) === '>') {
        // @ts-ignore
        const delta = new Delta();
        const ops = delta.retain(position - 1).insert('» ').delete(2);
        q.updateContents(ops);
      }
    }
  }

  hasMandatoryInfos() {
    return this.loadedProject !== undefined && this.loadedProject.title.trim().length > 0 && this.loadedProject.author.trim().length > 0 && this.loadedProject.lang.trim().length > 0;
  }

  resetAll() {
    this.currentSelectedInTree = undefined;
    this.currentBackupUuid = '';
    this.loadedProject = undefined;
    this.setSidebarSize();
    this.editorEnable = false;
  }

  isCurrentSelected(id?: string) {
    return this.currentSelectedInTree !== undefined && this.currentSelectedInTree === id;
  }

  openSettings() {
    this.changeSelection();
    this.showSettings = true;
    this.showStats = false;
  }

  openStats() {
    this.changeSelection();
    this.showStats = true;
    this.showSettings = false;
  }

  async backup(message: boolean = true) {
    if (!this.hasMandatoryInfos()) {
      return;
    }
    const wordsCount = this.updateGlobalWordsCount();
    this.saveCurrentToProject();

    if (this.loadedProject !== undefined) {
      // stats
      const baseStats: WordStats = this.loadedProject.wordStats
        ? { daily: { ...this.loadedProject.wordStats.daily } }
        : { daily: {} };

      const delta = wordsCount.new - wordsCount.old;
      const dayKey = this.getTZDayKey();
      baseStats.daily[dayKey] = (baseStats.daily[dayKey] ?? 0) + delta;

      this.loadedProject.wordStats = baseStats;
      // end stats

      const data = await this.backupService.saveBackup(this.loadedProject);

      if (data !== undefined) {
        this.currentBackupUuid = data;
        if (message) {
          this.snackBar.open(`Backup done`, 'Ok', { duration: 2000 });
        }
        this.lastBackupAt = Date.now();
      } else {
        this.snackBar.open(`!!! Backup error - Data not saved !!!`, 'Ok', { duration: 5000 });
        if (this.hasMandatoryInfos()) {
          this.backupFailover();
        }
      }

    }
    this.backupLocalStorage();
  }

  private getTZDayKey(d: Date = new Date()): string {
    // TODO: Format ISO YYYY-MM-DD avec timezone Europe/Paris
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(d); // ex: "2025-09-03"
  }

  openProjectsModal(data: any) {
    const dialogRef = this.dialog.open(BrowsedialogComponent, {
      width: '750px',
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
      data: { input: data }
    });

    // todo: load backup
    dialogRef.afterClosed().subscribe(async result => {
      if (result !== undefined && result.validated && result.data !== undefined) {
        this.editorEnable = false;
        if (result.data.tabIndex === -1 && result.data.store) {
          await this.storeLocation();
        } else if (result.data.tabIndex === 0) {
          await this.createNewProject();
        } else if (result.data.tabIndex === 2) {
          this.resetAll();
          // console.log(result.data.recoveryData);
          if (result.data.recoveryData?.data !== undefined) {
            this.loadRecovery(result.data.recoveryData.data);
          } else {
            this.snackBar.open(`Cannot recover project`, 'Close', { duration: 2000 });
          }
        } else if (result.data.tabIndex === 1 && result.data.projectId !== undefined) {
          this.resetAll();
          this.loadBackup(result.data.projectId);
        } else {
          this.snackBar.open(`Cannot open project`, 'Close', { duration: 2000 });
        }
      }
    });
  }

  async listAllProjects() {
    this.backup(this.loadedProject?.settings.backupAutoDisplayMessage);
    const data = await this.backupService.listBackup();
    if (data !== undefined) {
      this.openProjectsModal(data);
    } else {
      this.resetAll();
      this.checkMandatorySettings();
    }
  }

  async createNewProject() {
    this.resetAll();
    const project = await this.backupService.createProject();
    project.content.forEach((c: any) => {
      if (c.parentId === null) {
        delete c.parentId;
      }
    });
    this.currentBackupUuid = project.id;
    this.loadedProject = project;
    this.setSidebarSize();
    if (this.loadedProject !== undefined && !this.i18n.isSupportedLanguage(this.loadedProject.lang)) {
      if (this.i18n.isSupportedLanguage(this.i18n.selectedLang)) {
        this.loadedProject.lang = this.i18n.selectedLang;
      } else {
        this.loadedProject.lang = this.i18n.getDefaultLang().code;
      }
    }
    this.updateGlobalWordsCount();
    this.openSettings();
  }

  async storeLocation() {
    const data = await this.backupService.openStoreLocation();
    if (data) {
      this.listAllProjects();
    } else {
      this.snackBar.open(`Cannot open storage location`, 'Close', { duration: 3000 });
    }
  }

  async loadBackup(projectId: any) {
    const project = await this.backupService.loadBackup(projectId);
    project.content.forEach((c: any) => {
      if (c.parentId === null) {
        delete c.parentId;
      }
    });
    this.currentBackupUuid = project.id;
    this.loadedProject = project;
    this.setSidebarSize();
    this.i18n.setLang(project.lang);
    this.updateGlobalWordsCount();
    this.checkMandatorySettings();
  }

  loadRecovery(data: any) {
    this.loadedProject = data;
    this.setSidebarSize();
    this.currentBackupUuid = '';
    this.updateGlobalWordsCount();
    this.checkMandatorySettings();
    this.openSettings();
  }

  setSidebarSize() {
    try {
      const root = document.documentElement;
      root.style.setProperty('--sidebarwidth', `${this.loadedProject?.settings.leftbar ?? 240}px`);
      root.style.setProperty('--rightbarwidth', `${this.loadedProject?.settings.rightbar ?? 240}px`);
    } catch (e) {
      //
    }
  }

  backupLocalStorage() {
    const uuid = this.currentBackupUuid;
    const data = this.loadedProject;

    try {
      localStorage.setItem('backup', JSON.stringify({ uuid, time: Date.now(), data }));
    } catch (error: any) {
      this.snackBar.open(`!!! Backup error - Browser storage is not available !!!`, 'Ok', { duration: 5000 });
    }
  }

  backupFailover() {
    const uuid = this.currentBackupUuid;
    const data = this.loadedProject;

    try {
      localStorage.setItem(Failover.getBestFailover(), JSON.stringify({ uuid, time: Date.now(), data }));
    } catch (error: any) {
      this.snackBar.open(`!!! Backup error - Browser storage is not available !!!`, 'Ok', { duration: 5000 });
    }
  }

  updateGlobalWordsCount() {
    const oldCount = this.globalWordsCount;
    this.globalWordsCount = this.loadedProject !== undefined ? this.loadedProject.content.filter((p: Content) => !p.isFolder && !p.isTrash && p.isBook).map((p: { words: any; }) => p.words ?? 0).reduce((a: any, b: any) => { return a + b; }) : 0;
    const objective = this.loadedProject?.settings?.totalWords ?? 0;
    this.globalWordsPct = objective > 0 ? Math.round(100 * this.globalWordsCount / objective) : 0;
    this.updateCharsCount();
    return { old: oldCount, new: this.globalWordsCount };
  }

  async updateCharsCount() {
    let totalChars = 0;

    this.loadedProject?.content
      .filter((p: Content) => !p.isFolder && !p.isTrash && p.isBook)
      .forEach((p: any) => {
        const text = p.chapter ?? "";
        const clean = text.replace(/<\/?p>/gi, "");
        totalChars += clean.length;
      });

    this.globalCharsCount = totalChars;
  }

  disableEditor() {
    this.editorEnable = false;
  }

  enableEditor() {
    this.editorEnable = true;
  }

  getCurrentSelectedUserContent(): Content | undefined {
    return this.loadedProject?.content.find((c: { id: string | undefined; }) => c.id === this.currentSelectedInTree);
  }

  checkMandatorySettings() {
    const checked = this.loadedProject !== undefined && this.loadedProject.title.trim().length > 0 && this.loadedProject.author.trim().length > 0 && this.loadedProject.lang.trim().length > 0;
    if (this.loadedProject !== undefined && this.loadedProject.description.trim().length === 0) {
      this.loadedProject.description = 'n/a';
    }
    if (!checked) {
      this.showSettings = true;
      this.showStats = false;
      this.snackBar.open(`Please fill in the basic information`, 'Ok', { duration: 2000 });
    }
    return checked;
  }

  saveCurrentToProject() {
    const selected = this.getCurrentSelectedUserContent();
    if (selected !== undefined) {
      selected.isBook = this.isBookRootChild(selected);
      selected.chapter = this.isCharacterContext() ? this.saveCharacter() : cleanQuillHtmlToParagraphs(this.editor);
      selected.notes = this.notes;
    }
  }

  exportJEFormat() {
    const selected = this.getCurrentSelectedUserContent();
    if (!selected || !this.isBookRootChild(selected)) return;

    const title = `<p style="line-height:20px; text-align: center; font-weight: bold; margin: 0 0 32px 0; font-size: 18px;">${selected.name}</p>`;
    const chapter = cleanQuillHtmlToParagraphs(this.editor);

    const formattedParagraphs = chapter.replaceAll(
      /<p>(.*?)<\/p>/gs,
      `<p style="line-height:20px; text-align: justify; margin: 0 0 5px 0;">\n$1\n</p>`
    );

    const finalHtml = `
<div style="text-indent: 15px; padding: 2%; width: 90%; font-family: 'Times New Roman'; font-size: 16px;">
${title}
${formattedParagraphs}
</div>`.trim();

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(finalHtml).catch(err => {
        this.snackBar.open(`Cannot copy to clipboard`, 'Ok', { duration: 3000 });
      });
    } else {
      this.snackBar.open(`No clipboard available`, 'Ok', { duration: 3000 });
    }

    this.snackBar.open(`Text copied to clipboard`, 'Ok', { duration: 3000 });
  }

  loadDefaultEditorContent(menuItem: Content | undefined) {
    if (menuItem === undefined) {
      return '';
    } else if (menuItem?.chapter === undefined) {
      // default template for character (add others after)
      if (this.isCharacterRootChild(menuItem)) {
        menuItem.isCharacter = true;
        return this.characterTemplate;
      } else {
        return '';
      }
    } else {
      return menuItem.chapter;
    }
  }

  async changeSelection(menuItem?: Content) {
    if (!this.checkMandatorySettings()) {
      return;
    }
    this.updateGlobalWordsCount();
    this.showSettings = false;
    this.showStats = false;
    this.saveCurrentToProject();
    this.currentCharacterData = this.DEFAULT_CHARACTER_DATA;
    this.currentSelectedInTree = menuItem?.id;
    this.editor = this.loadDefaultEditorContent(menuItem);
    this.notes = menuItem?.notes ?? '';
    if (menuItem !== undefined && !menuItem.isFolder) {
      this.enableEditor();
      if (this.isCharacterContext()) {
        this.currentCharacterData = this.parseCharacter(menuItem);
      }
    } else {
      this.disableEditor();
    }
    if (this.loadedProject?.settings.backupOnChange) {
      await this.backup(this.loadedProject?.settings.backupAutoDisplayMessage);
    }
  }

  increaseOrderIdsFrom(fromOrderId: number) {
    this.loadedProject?.content.forEach((item: { orderId: number; }) => item.orderId = item.orderId >= fromOrderId ? item.orderId + 1 : item.orderId);
  }

  getRootMenuItems() {
    return this.getChildren(undefined).filter((item) => item.isTrash !== true || this.getChildren(item.id).length > 0);
  }

  getChildren(parentId?: string): Content[] {
    const arr = this.loadedProject?.content.filter((item: any) => item.parentId === parentId);
    return arr !== undefined ? this.sortBy(arr, t => t.orderId) : [];
  }

  hasChildren(id?: string): boolean {
    return this.getChildren(id).length > 0;
  }

  getMaxOrderId(): number {
    return this.loadedProject !== undefined ? Math.max(...this.loadedProject.content.map((arr: { orderId: any; }) => arr.orderId)) : 0;
  }

  getNewMaxOrder(): number {
    if (this.loadedProject !== undefined) {
      let maxOrderId = Math.max(...this.loadedProject.content.map((arr: { orderId: any; }) => arr.orderId));
      return 1 + maxOrderId;
    } else {
      return 0;
    }
  }

  getMenuItemById(id: string): Content | undefined {
    return this.loadedProject?.content.find((item: { id: string; }) => item.id === id);
  }

  getTrashId(): string | undefined {
    const trashId = this.loadedProject?.content.find((item: { isTrash: boolean; }) => item.isTrash === true);
    return trashId !== undefined ? trashId.id : undefined;
  }

  isTrashChild(menuItem: Content): boolean {
    const trashId = this.getTrashId();
    if (trashId === undefined) {
      return false;
    } else if (menuItem.parentId === trashId) {
      return true;
    } else if (menuItem.parentId !== undefined) {
      const parent = this.getMenuItemById(menuItem.parentId);
      return parent !== undefined ? this.isTrashChild(parent) : false;
    } else {
      return false;
    }
  }

  getBookRootId(): string | undefined {
    const bookId = this.loadedProject?.content.find((item: { isBook: boolean; }) => item.isBook === true);
    return bookId !== undefined ? bookId.id : undefined;
  }

  isBookRootChild(menuItem: Content): boolean {
    const bookId = this.getBookRootId();
    if (bookId === menuItem.id) {
      return true;
    } else if (bookId === undefined) {
      return false;
    } else if (menuItem.parentId === bookId) {
      return true;
    } else if (menuItem.parentId !== undefined) {
      const parent = this.getMenuItemById(menuItem.parentId);
      return parent !== undefined ? this.isBookRootChild(parent) : false;
    } else {
      return false;
    }
  }

  getCharacterRootId(): string | undefined {
    const characterId = this.loadedProject?.content.find((item: { isCharacter: boolean; }) => item.isCharacter === true);
    return characterId !== undefined ? characterId.id : undefined;
  }

  isCharacterRootChild(menuItem: Content): boolean {
    const characterId = this.getCharacterRootId();
    if (characterId === menuItem.id) {
      return true;
    } else if (characterId === undefined) {
      return false;
    } else if (menuItem.parentId === characterId) {
      return true;
    } else if (menuItem.parentId !== undefined) {
      const parent = this.getMenuItemById(menuItem.parentId);
      return parent !== undefined ? this.isCharacterRootChild(parent) : false;
    } else {
      return false;
    }
  }

  isCharacterRootChildByParentId(parentId: string): boolean {
    const characterId = this.getCharacterRootId();
    if (characterId === undefined) {
      return false;
    } else if (parentId === characterId) {
      return true;
    } else if (parentId !== undefined) {
      const parent = this.getMenuItemById(parentId);
      return parent !== undefined ? this.isCharacterRootChild(parent) : false;
    } else {
      return false;
    }
  }

  rename(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.rename);
  }

  addChildFolder(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.addChildFolder);
  }

  addChildEditor(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.addChildEditor);
  }

  addFolderBefore(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.addFolderBefore);
  }

  addFolderAfter(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.addFolderAfter);
  }

  addEditorBefore(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.addEditorBefore);
  }

  addEditorAfter(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.addEditorAfter);
  }

  deleteItem(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.delete);
  }

  emptyTrash(menuItem: any) {
    this.closeAllContexts();
    this.openModal(menuItem, this.modalActions.emptyTrash);
  }

  private getSiblingsSorted(menuItem: any): any[] {
    const parentId = menuItem.parentId ?? undefined;
    const siblings = (this.loadedProject?.content ?? []).filter(it => it.parentId === parentId);
    return this.sortBy(siblings, (t: any) => t.orderId);
  }

  private swapWithinSiblings(menuItem: any, direction: 1 | -1): void {
    const siblings = this.getSiblingsSorted(menuItem);
    if (!siblings.length) return;

    const idx = siblings.findIndex(it => it.id === menuItem.id);
    if (idx < 0) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    const neighbor = siblings[targetIdx];
    const tmp = neighbor.orderId;
    neighbor.orderId = menuItem.orderId;
    menuItem.orderId = tmp;
  }

  moveTop(menuItem: any) {
    this.closeAllContexts();
    this.swapWithinSiblings(menuItem, -1);
    if (this.loadedProject?.settings.backupOnChange) {
      this.backup(this.loadedProject?.settings.backupAutoDisplayMessage);
    }
  }

  moveBottom(menuItem: any) {
    this.closeAllContexts();
    this.swapWithinSiblings(menuItem, +1);
    if (this.loadedProject?.settings.backupOnChange) {
      this.backup(this.loadedProject?.settings.backupAutoDisplayMessage);
    }
  }

  toggleContextualMenu(event: any, item: any) {
    event.preventDefault();
    this.loadedProject?.content.forEach((element: { context: boolean; }) => {
      element.context = false;
    });
    item.context = true
  }

  closeAllContexts() {
    this.loadedProject?.content.forEach((element: { context: boolean; }) => {
      element.context = false;
    });
  }

  openModal(menuItem: any, action: any) {
    const modalRef = this.modalService.open(ModaleComponent);
    let menuItemName: string = menuItem.name;
    if (menuItemName.endsWith('|I18N')) {
      const treeNodes = this.i18n.data.treeNodes;
      menuItemName = treeNodes[menuItemName] !== undefined ? treeNodes[menuItemName] : menuItemName;
    }
    modalRef.componentInstance.name = `${action.description}: ${menuItemName}`;

    if (action.key === this.modalActions.delete.key) {
      modalRef.componentInstance.extraMessage = 'This item and its children will be moved to trash';
      modalRef.componentInstance.inputTitle = 'HIDE';
      modalRef.componentInstance.inputContent = '';
      modalRef.componentInstance.confirmLabel = 'Move to trash';
    } else if (action.key === this.modalActions.emptyTrash.key) {
      modalRef.componentInstance.extraMessage = 'Please confirm deletion by typing DELETE';
      modalRef.componentInstance.inputTitle = 'Confirm deletion';
      modalRef.componentInstance.inputContent = '';
      modalRef.componentInstance.confirmLabel = 'Delete';
    } else if (action.key === this.modalActions.rename.key) {
      modalRef.componentInstance.extraMessage = '';
      modalRef.componentInstance.inputTitle = 'New name';
      modalRef.componentInstance.inputContent = menuItemName;
      modalRef.componentInstance.confirmLabel = 'Rename';
    } else {
      modalRef.componentInstance.extraMessage = '';
      modalRef.componentInstance.inputTitle = 'New element name';
      modalRef.componentInstance.inputContent = '';
      modalRef.componentInstance.confirmLabel = 'Add';
    }

    modalRef.result.then(
      async (result) => {
        let newName = new String(result);
        if (newName.length > 0 || action.key === this.modalActions.delete.key) {
          let refOrder = menuItem.orderId;
          if (action.key === this.modalActions.rename.key) {
            menuItem.name = newName;
          } else if (action.key === this.modalActions.addChildFolder.key) {
            menuItem.expanded = true;
            this.loadedProject?.content.push({
              id: UuidUtils.v7(),
              parentId: menuItem.id,
              orderId: this.getNewMaxOrder(),
              name: newName.toString(),
              icon: 'folder',
              expanded: false,
              context: false,
              canBeDeleted: true,
              isFolder: true,
              isBook: false,
              isSummary: false,
              isTrash: false,
              isCharacter: this.isCharacterRootChildByParentId(menuItem.id),
              words: 0
            })
          } else if (action.key === this.modalActions.addChildEditor.key) {
            menuItem.expanded = true;
            this.loadedProject?.content.push({
              id: UuidUtils.v7(),
              chapter: '',
              notes: '',
              parentId: menuItem.id,
              orderId: this.getNewMaxOrder(),
              name: newName.toString(),
              icon: 'file-earmark',
              expanded: false,
              context: false,
              canBeDeleted: true,
              isFolder: false,
              isBook: false,
              isSummary: false,
              isTrash: false,
              isCharacter: this.isCharacterRootChildByParentId(menuItem.id),
              words: 0
            })
          } else if (action.key === this.modalActions.addFolderAfter.key) {
            this.increaseOrderIdsFrom(refOrder + 1);
            this.loadedProject?.content.push({
              id: UuidUtils.v7(),
              parentId: menuItem.parentId,
              orderId: refOrder + 1,
              name: newName.toString(),
              icon: menuItem.parentId === undefined ? 'bookmark' : 'folder',
              expanded: false,
              context: false,
              canBeDeleted: true,
              isFolder: true,
              isBook: false,
              isSummary: false,
              isTrash: false,
              isCharacter: this.isCharacterRootChildByParentId(menuItem.parentId),
              words: 0
            })
          } else if (action.key === this.modalActions.addFolderBefore.key) {
            this.increaseOrderIdsFrom(refOrder);
            this.loadedProject?.content.push({
              id: UuidUtils.v7(),
              parentId: menuItem.parentId,
              orderId: refOrder,
              name: newName.toString(),
              icon: menuItem.parentId === undefined ? 'bookmark' : 'folder',
              expanded: false,
              context: false,
              canBeDeleted: true,
              isFolder: true,
              isBook: false,
              isSummary: false,
              isTrash: false,
              isCharacter: this.isCharacterRootChildByParentId(menuItem.parentId),
              words: 0
            })
          } else if (action.key === this.modalActions.addEditorAfter.key) {
            this.increaseOrderIdsFrom(refOrder + 1);
            this.loadedProject?.content.push({
              id: UuidUtils.v7(),
              chapter: '',
              notes: '',
              parentId: menuItem.parentId,
              orderId: refOrder + 1,
              name: newName.toString(),
              icon: 'file-earmark',
              expanded: false,
              context: false,
              canBeDeleted: true,
              isFolder: false,
              isBook: false,
              isSummary: false,
              isTrash: false,
              isCharacter: this.isCharacterRootChildByParentId(menuItem.parentId),
              words: 0
            })
          } else if (action.key === this.modalActions.addEditorBefore.key) {
            this.increaseOrderIdsFrom(refOrder);
            this.loadedProject?.content.push({
              id: UuidUtils.v7(),
              chapter: '',
              notes: '',
              parentId: menuItem.parentId,
              orderId: refOrder,
              name: newName.toString(),
              icon: 'file-earmark',
              expanded: false,
              context: false,
              canBeDeleted: true,
              isFolder: false,
              isBook: false,
              isSummary: false,
              isTrash: false,
              isCharacter: this.isCharacterRootChildByParentId(menuItem.parentId),
              words: 0
            })
          } else if (action.key === this.modalActions.delete.key && menuItem.canBeDeleted) {
            const trashId = this.getTrashId();
            this.loadedProject?.content.filter((item: any) => item.parentId === menuItem.id).forEach((item: any) => { item.parentId = trashId });
            menuItem.parentId = trashId;
          } else if (action.key === this.modalActions.emptyTrash.key && newName.toUpperCase() === 'DELETE') {
            if (this.loadedProject !== undefined) {
              const trashId = this.getTrashId();
              this.loadedProject.content = this.loadedProject?.content.filter((item: any) => item.parentId !== trashId);
            }
          }
        }
        if (this.loadedProject?.settings.backupOnChange) {
          this.backup(this.loadedProject?.settings.backupAutoDisplayMessage);
        }
      },
      (reason) => {
        // dismiss
      },
    );
  }

  sortBy<T, V>(
    array: T[],
    valueExtractor: (t: T) => V,
    comparator?: (a: V, b: V) => number) {
    const c = comparator ?? ((a, b) => a > b ? 1 : -1)
    return array.sort((a, b) => c(valueExtractor(a), valueExtractor(b)))
  }

  async exportEpub() {
    const dialogRef = this.dialog.open(DownloaddialogComponent, {
      width: '500px',
      enterAnimationDuration: 250,
      exitAnimationDuration: 250,
      autoFocus: false,
      data: { uuid: this.currentBackupUuid }
    });
  }

  isCharacterContext(): boolean {
    return this.currentSelectedInTree !== undefined ? this.isCharacterRootChildByParentId(this.currentSelectedInTree) : false;
  }

  parseCharacter(content: Content): any {
    if (content.chapter !== undefined) {
      try {
        let charData = JSON.parse(content.chapter);
        return {
          name: charData.name,
          age: charData.age,
          location: charData.location,
          details: charData.details,
          background: charData.background,
          relation: charData.relation,
          personality: charData.personality,
          appearance: charData.appearance,
          notes: charData.notes,
        }
      } catch (e) {
        // console.log(e);
      }
    }
    return this.DEFAULT_CHARACTER_DATA;
  }

  saveCharacter(): string {
    const currentContent = this.getCurrentSelectedUserContent();
    if (currentContent !== undefined) {
      try {
        this.currentCharacterData.name = currentContent.name;
        return JSON.stringify(this.currentCharacterData);
      } catch (e) {
        // console.log(e);
      }
    }
    return JSON.stringify(this.DEFAULT_CHARACTER_DATA);
  }
}

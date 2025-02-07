import { Component, OnInit, Input } from '@angular/core';
import { EditorService } from '../services/editor.service.js';
import { Content } from "../types/userproject.js";
import { I18nService } from '../services/i18n.service.js';
import { SharedModule } from '../shared.module.js';

@Component({
  selector: 'app-tree-item',
  imports: [SharedModule],
  templateUrl: './tree-item.component.html',
  styleUrl: './tree-item.component.scss'
})
export class TreeItemComponent implements OnInit {
  @Input() menuItem!: Content;
  @Input() level: number = 0;

  constructor(public editorService: EditorService,
    private i18n: I18nService) { }

  ngOnInit(): void {
    //
  }

  translate(name: string) {
    const data = this.i18n.data.treeNodes;
    if (name.endsWith('|I18N') && data[name] !== undefined) {
      return data[name];
    } else {
      return name;
    }
  }
}

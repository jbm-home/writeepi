import { Component, OnInit, Input } from '@angular/core';
import { EditorService } from '../services/editor.service';
import { Content } from "../types/userproject";
import { I18nService } from '../services/i18n.service';
import { I18nPipe } from '../pipes/i18n.pipe';

@Component({
  selector: 'app-tree-item',
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

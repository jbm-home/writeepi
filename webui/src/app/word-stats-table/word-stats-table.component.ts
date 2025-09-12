import { AfterViewInit, Component, inject, Input } from '@angular/core';
import { Period } from '../types/userproject.js';
import { EditorService } from '../services/editor.service.js';
import { SharedModule } from '../shared.module.js';

@Component({
  selector: 'app-word-stats-table',
  imports: [SharedModule],
  templateUrl: './word-stats-table.component.html',
  styleUrls: ['./word-stats-table.component.scss'],
})
export class WordStatsTableComponent implements AfterViewInit {
  private editor = inject(EditorService);

  ngAfterViewInit(): void {
    this.buildTable();
  }

  private _period: Period = 'day';
  @Input() set period(p: Period) {
    if (p !== this._period) {
      this._period = p;
    }
  }

  private _limit = 365;
  @Input() set limit(n: number) {
    const clamped = Math.min(Math.max(1, Math.floor(n || 1)), 365);
    if (clamped !== this._limit) {
      this._limit = clamped;
    }
  }

  @Input() title = 'Word statistics';
  @Input() timeZone = 'Europe/Paris'; // TODO

  includeZeros = true;
  rows: Array<{ key: string; words: number }> = [];
  avgValue = 0;
  globalCharsCount = this.editor.globalCharsCount;
  globalWordsCount = this.editor.globalWordsCount;

  private aggregated: Record<string, number> = {};

  public buildTable() {
    this.aggregated = { ...(this.editor.loadedProject?.wordStats?.daily ?? {}) };
    this.buildRows();
  }

  private buildRows() {
    const entries = Object.entries(this.aggregated);
    entries.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));

    const limited = entries.slice(0, this._limit);
    this.rows = limited.map(([key, words]) => ({ key, words }));

    const total = this.rows.reduce((s, r) => s + r.words, 0);

    const denom =
      this.includeZeros
        ? (this.rows.length || 1)
        : (this.rows.filter(r => r.words !== 0).length || 1);

    this.avgValue = Math.round((total / denom) * 100) / 100;
  }

  labelForAvg(): string {
    if (this._period === 'day') return 'Average / day';
    if (this._period === 'week') return 'Average / week';
    return 'Average / month';
  }
}

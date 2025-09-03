import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Period, WordStats } from '../types/userproject.js';

@Component({
  standalone: true,
  selector: 'app-word-stats-table',
  imports: [CommonModule],
  templateUrl: './word-stats-table.component.html',
  styleUrls: ['./word-stats-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WordStatsTableComponent {

  private _stats: WordStats | undefined;
  @Input() set stats(v: WordStats | undefined) {
    if (v !== this._stats) {
      this._stats = v;
      this.refresh();
    }
  }

  private _period: Period = 'day';
  @Input() set period(p: Period) {
    if (p !== this._period) {
      this._period = p;
      this.refresh();
    }
  }

  private _limit = 365;
  @Input() set limit(n: number) {
    const clamped = Math.min(Math.max(1, Math.floor(n || 1)), 365);
    if (clamped !== this._limit) {
      this._limit = clamped;
      this.buildRows();
    }
  }

  @Input() includeZeros = true;
  @Input() title = 'Word statistics';
  @Input() timeZone = 'Europe/Paris'; // TODO

  rows: Array<{ key: string; words: number }> = [];
  avgValue = 0;
  total = 0;

  private aggregated: Record<string, number> = {};
  private loading = false;

  private async refresh() {
    if (!this._stats) {
      this.aggregated = {};
      this.buildRows();
      return;
    }
    this.loading = true;
    try {
      this.aggregated = this._stats.daily;
      console.log(this.aggregated);
    } catch {
      this.aggregated = {};
    } finally {
      this.loading = false;
      this.buildRows();
    }
  }

  private buildRows() {
    const entries = Object.entries(this.aggregated);
    entries.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));

    const limited = entries.slice(0, this._limit);
    this.rows = limited.map(([key, words]) => ({ key, words }));

    this.total = this.rows.reduce((s, r) => s + r.words, 0);

    const denom =
      this.includeZeros
        ? (this.rows.length || 1)
        : (this.rows.filter(r => r.words !== 0).length || 1);

    this.avgValue = Math.round((this.total / denom) * 100) / 100;
  }

  labelForAvg(): string {
    if (this._period === 'day') return 'Average / day';
    if (this._period === 'week') return 'Average / week';
    return 'Average / month';
  }

  get period(): Period { return this._period; }
  get limit(): number { return this._limit; }
  get stats(): WordStats | undefined { return this._stats; }
}

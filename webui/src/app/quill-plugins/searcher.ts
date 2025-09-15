type AnyRange = globalThis.Range;

export default class Searcher {
  constructor(private quill: any) { }

  clear() {
    (CSS as any).highlights?.delete('search-hit');
  }

  highlight(term: string) {
    this.clear();
    if (!term) return;

    const api = (CSS as any).highlights;
    if (!api) {
      // highlight api not available
      // TODO: fallback
      return;
    }

    const text = this.quill.getText();
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    const ranges: AnyRange[] = [];
    for (let m; (m = re.exec(text));) {
      const start = m.index;
      const len = m[0].length;
      const domRange = this.indexToRange(start, len);
      if (domRange) ranges.push(domRange);
    }

    if (ranges.length) {
      const highlight = new (window as any).Highlight(...ranges);
      api.set('search-hit', highlight);
    }
  }

  private indexToRange(index: number, length: number): Range {
    const [startLeaf, startOffset] = this.quill.getLeaf(index);
    const [endLeaf, endOffset] = this.quill.getLeaf(index + length);

    const r = new Range();
    r.setStart(startLeaf.domNode, startOffset);
    r.setEnd(endLeaf.domNode, endOffset);
    return r;
  }
}

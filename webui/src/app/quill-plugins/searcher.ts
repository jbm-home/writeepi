type AnyRange = globalThis.Range;

export default class Searcher {
  constructor(private quill: any) { }

  clear() {
    (CSS as any).highlights?.delete('search-hit');
  }

  highlight(term: string): number {
    this.clear();
    if (!term) return 0;

    const api = (CSS as any).highlights;
    if (!api) {
      // highlight api not available
      // TODO: fallback
      return 0;
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

    if (ranges.length > 0) {
      const highlight = new (window as any).Highlight(...ranges);
      api.set('search-hit', highlight);

      this.goToFirst(ranges);
      return ranges.length;
    }
    return 0;
  }

  private goToFirst(ranges: Range[]) {
    const container = this.quill.root as HTMLElement;

    if (ranges.length > 0 && container) {
      requestAnimationFrame(() => {
        const rect = ranges[0].getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const margin = 16;
        const relativeTop = rect.top - containerRect.top + container.scrollTop;

        const targetTop =
          relativeTop -
          (container.clientHeight - rect.height) / 2 -
          margin;

        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' });
      });
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

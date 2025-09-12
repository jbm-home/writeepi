import Quill from 'quill';

class Searcher {
  private quill: any;
  private overlay: HTMLElement;

  constructor(quill: Quill, options: any) {
    this.quill = quill;

    const container = (this.quill.root as HTMLElement).parentElement;
    this.overlay = document.createElement("div");
    this.overlay.className = "search-overlay";
    container?.appendChild(this.overlay);

    this.quill.root.addEventListener("scroll", () => {
      this.overlay.style.transform = `translateY(${-this.quill.root.scrollTop}px)`;
    });
  }

  search(searched: string) {
    this.removeStyle();

    const text = this.quill.getText();
    const regex = new RegExp(searched, "gi");
    let match;
    const bounds: any[] = [];

    while ((match = regex.exec(text)) !== null) {
      const index = match.index;
      const length = match[0].length;
      bounds.push(this.quill.getBounds(index, length));
    }

    bounds.forEach(bound => {
      const highlight = document.createElement("div");
      highlight.className = "search-highlight";
      highlight.style.top = bound.top + "px";
      highlight.style.left = bound.left + "px";
      highlight.style.width = bound.width + "px";
      highlight.style.height = bound.height + "px";

      this.overlay.appendChild(highlight);
    });

    const container = this.quill.root as HTMLElement;
    if (bounds.length > 0 && container) {
      requestAnimationFrame(() => {
        const margin = 16;
        const targetTop =
          container.scrollTop +
          bounds[0].top -
          (container.clientHeight - bounds[0].height) / 2 -
          margin;

        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' });
      });
    }

    // setTimeout(() => {
    //   this.removeStyle();
    // }, 1000);
  }

  removeStyle() {
    if (!this.overlay) return;
    this.overlay.innerHTML = '';
  }
}

export default Searcher;

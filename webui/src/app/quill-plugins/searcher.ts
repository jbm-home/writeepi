import Quill from 'quill';

class Searcher {
  private quill: any;

  // Propriétés statiques pour gérer l’état
  static occurrencesIndices: number[] | null = [];
  static currentIndex = 0;
  static SearchedStringLength = 0;

  constructor(quill: Quill, options: any) {
    this.quill = quill;
  }

  search(searched: string) {
    this.removeStyle();

    if (searched.length > 0) {
      const totalText = this.quill.getText();
      const re = new RegExp(searched, 'gi');
      const match = re.test(totalText);

      if (match) {
        const indices = (Searcher.occurrencesIndices = totalText.getIndicesOf(searched));
        const length = (Searcher.SearchedStringLength = searched.length);

        indices.forEach((index: any) =>
          this.quill.formatText(index, length, 'SearchedString', true)
        );

        if (indices.length > 0) {
          // this.quill.setSelection(indices[0], length, 'user');
          const firstIndex = indices[0];
          const bounds = this.quill.getBounds(firstIndex, length);
          this.quill.root.scrollTop = bounds.top;
        }
      } else {
        Searcher.occurrencesIndices = null;
        Searcher.currentIndex = 0;
      }
    }
  }

  removeStyle() {
    this.quill.formatText(0, this.quill.getText().length, 'SearchedString', false);
  }
}

declare global {
  interface String {
    getIndicesOf(searchStr: string): number[];
  }
}

String.prototype.getIndicesOf = function (searchStr: string): number[] {
  const searchStrLen = searchStr.length;
  let startIndex = 0;
  let index;
  const indices: number[] = [];

  while ((index = this.toLowerCase().indexOf(searchStr.toLowerCase(), startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }

  return indices;
};

export default Searcher;

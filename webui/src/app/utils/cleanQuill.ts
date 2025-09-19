export function cleanQuillHtmlToParagraphs(html: string): string {
  const doc = globalThis.document;
  const container = doc.createElement('div');
  container.innerHTML = html ?? '';

  const blocks = container.querySelectorAll(
    'p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, div',
  );

  const paras: string[] = [];

  const sanitizeNode = (el: HTMLElement): string => {
    const walk = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '')
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ');
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childEl = node as HTMLElement;
        const tag = childEl.tagName.toLowerCase();
        const children = Array.from(childEl.childNodes).map(walk).join('');

        if (tag === 'strong' || tag === 'b') return `<strong>${children}</strong>`;
        if (tag === 'em' || tag === 'i') return `<em>${children}</em>`;
        if (tag === 'u') return `<u>${children}</u>`;

        // blocs : on garde les classes ql-align-xxx si présentes
        if (tag === 'p' || tag === 'div' || tag.startsWith('h')) {
          let cssClass = '';
          if (childEl.classList.contains('ql-align-center')) cssClass = 'ql-align-center';
          else if (childEl.classList.contains('ql-align-right')) cssClass = 'ql-align-right';
          else if (childEl.classList.contains('ql-align-justify')) cssClass = 'ql-align-justify';

          return cssClass
            ? `<p class="${cssClass}">${children}</p>`
            : `<p>${children}</p>`;
        }

        return children;
      }
      return '';
    };

    return walk(el).trim();
  };

  const pushPara = (el: HTMLElement) => {
    const clean = sanitizeNode(el).trim();
    if (clean) paras.push(clean);
  };

  if (blocks.length === 0) {
    pushPara(container);
  } else {
    blocks.forEach((b) => pushPara(b as HTMLElement));
  }

  return paras.join('');
}

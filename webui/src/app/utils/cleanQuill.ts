export function cleanQuillHtmlToParagraphs(html: string): string {
  const doc = globalThis.document;
  if (!doc) {
    // Fallback: plain text
    const textOnly = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textOnly ? `<p>${textOnly}</p>` : '';
  }

  const container = doc.createElement('div');
  container.innerHTML = html ?? '';

  // Whitelist of allowed tags
  const allowed = ['STRONG', 'EM'];

  // Remove disallowed tags but keep their text content
  container.querySelectorAll('*').forEach((el) => {
    if (!allowed.includes(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes)); // strip tag, keep children!!
    }
  });

  // Collect block-level content
  const blocks = container.querySelectorAll(
    'p, li, h1, h2, h3, h4, h5, h6, blockquote, pre'
  );

  const paras: string[] = [];
  const pushPara = (raw: string | null | undefined) => {
    const clean = (raw ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean) paras.push(`<p>${clean}</p>`);
  };

  if (blocks.length === 0) {
    pushPara(container.innerHTML);
  } else {
    blocks.forEach((b) => pushPara(b.innerHTML));
  }

  return paras.join('');
}

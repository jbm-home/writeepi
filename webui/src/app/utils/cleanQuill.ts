export function cleanQuillHtmlToParagraphs(html: string): string {
  const doc = globalThis.document;
  if (!doc) { // fallback
    const textOnly = html
      .replace(/<[^>]*>/g, " ")        // remove tags
      .replace(/\u00a0/g, " ")         // NBSP -> space
      .replace(/\s+/g, " ")            // multiple spaces -> only one
      .trim();
    return textOnly ? `<p>${escapeHtml(textOnly)}</p>` : "";
  }

  const container = doc.createElement("div");
  container.innerHTML = html ?? "";

  const blocks = container.querySelectorAll(
    "p, li, div, h1, h2, h3, h4, h5, h6, blockquote, pre"
  );

  const paras: string[] = [];
  const pushPara = (raw: string | null | undefined) => {
    const clean = (raw ?? "")
      .replace(/\u00a0/g, " ") // NBSP -> space
      .replace(/\s+/g, " ")    // compress spaces + newlines
      .trim();
    if (clean) paras.push(`<p>${escapeHtml(clean)}</p>`);
  };

  if (blocks.length === 0) {
    pushPara(container.textContent);
  } else {
    blocks.forEach(b => pushPara(b.textContent));
  }

  return paras.join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

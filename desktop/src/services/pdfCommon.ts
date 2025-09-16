import { jsPDF } from "jspdf";
import { convert } from "html-to-text";
import { UserProject } from "../../../webui/src/app/types/userproject.js";

export class PdfCommon {
  readonly pdfMargin = 15;
  readonly pdfPageWidth = 210;
  readonly pdfPageHeight = 297;

  buildPdf(userContent: UserProject, resultPath?: string) {
    const pdfConverter = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [this.pdfPageWidth, this.pdfPageHeight],
    });

    pdfConverter.setFont("Verdana", "normal");

    this.addPdfTitle(
      pdfConverter,
      userContent.title,
      userContent.author,
      userContent.description,
    );

    const startPageBeforeChapters = pdfConverter.getNumberOfPages();

    userContent.content.forEach((c) => {
      if (c !== undefined && c.isBook && !c.isFolder) {
        this.addPdfChapter(
          c.name,
          c.chapter !== undefined ? c.chapter : "",
          pdfConverter,
        );
      }
    });

    const totalPages = pdfConverter.getNumberOfPages();
    const pageW = this.pdfPageWidth;
    const pageH = this.pdfPageHeight;
    const margin = this.pdfMargin;

    const firstChapterPage = startPageBeforeChapters + 1;

    pdfConverter.setFont("Verdana", "normal").setFontSize(10);

    for (let i = firstChapterPage; i <= totalPages; i++) {
      pdfConverter.setPage(i);
      const logicalNumber = i - startPageBeforeChapters;
      pdfConverter.text(
        `${logicalNumber}`,
        pageW - margin,
        pageH - margin / 2,
        {
          align: "right",
        },
      );
    }

    if (resultPath !== undefined) {
      pdfConverter.save(resultPath);
      return undefined;
    } else {
      return pdfConverter.output();
    }
  }

  private addPdfTitle(
    pdfConverter: jsPDF,
    title: string,
    author: string,
    description: string,
  ) {
    // title
    pdfConverter.setFont("Verdana", "bold").setFontSize(22);
    pdfConverter.text(title, this.pdfPageWidth / 2, 25, { align: "center" });
    pdfConverter.setFont("Verdana", "bold").setFontSize(18);
    pdfConverter.text(author, this.pdfPageWidth / 2, 40, { align: "center" });

    // description
    let iterations = 1;
    const defaultYJump = 5;
    const wrappedText = pdfConverter.splitTextToSize(
      description,
      this.pdfPageWidth - this.pdfMargin * 2,
    );
    pdfConverter.setFont("Verdana", "normal").setFontSize(14);
    wrappedText.forEach((line: string) => {
      const posY = this.pdfMargin + defaultYJump * iterations++;
      pdfConverter.text(line, 15, 100 + posY, { align: "justify" });
    });

    // footer
    pdfConverter.setFont("Verdana", "normal").setFontSize(15);
    pdfConverter.text(
      "© " + new Date().getFullYear() + " " + author,
      15,
      245,
      { align: "left" },
    );
    pdfConverter.setFont("Verdana", "italic").setFontSize(14);
    pdfConverter.text(
      "Any copy or distribution without the author's consent is forbidden.",
      15,
      260,
      { align: "left" },
    );
    pdfConverter.setFont("Verdana", "bold").setFontSize(14);
    pdfConverter.text(
      "Built with Writeepi (https://www.writeepi.com) " +
        new Date().toLocaleString(),
      15,
      270,
      { align: "left" },
    );
  }

  private addPdfChapter(title: string, content: string, pdf: jsPDF) {
    pdf.addPage();
    const margin = this.pdfMargin;
    const pageW = this.pdfPageWidth;
    const pageH = this.pdfPageHeight;
    const usableW = pageW - margin * 2;

    pdf.setFont("Verdana", "bold").setFontSize(20);
    let y = margin;
    pdf.text(title, pageW / 2, y, { align: "center" });
    y += 18;

    pdf.setFont("Verdana", "normal").setFontSize(16);
    const lineHeight = 8;
    const smallLineHeight = 3;

    const plain = convert(content, {
      wordwrap: false,
      preserveNewlines: true,
      selectors: [
        {
          selector: "p",
          options: { leadingLineBreaks: 0, trailingLineBreaks: 2 },
        },
        {
          selector: "br",
          format: "inline",
          options: { leadingLineBreaks: 0, trailingLineBreaks: 1 },
        },
        { selector: "li", format: "inline", options: { itemPrefix: "• " } },
        { selector: "a", options: { ignoreHref: true } },
      ],
    }).replace(/\u00A0|\u202F/g, " ");

    const logicalLines = plain.replace(/\r\n/g, "\n").split("\n");

    for (const logicalLine of logicalLines) {
      if (logicalLine.trim().length === 0) {
        y += smallLineHeight;
        continue;
      }

      const wrapped = pdf.splitTextToSize(logicalLine, usableW);

      for (const line of wrapped) {
        if (y > pageH - margin) {
          pdf.addPage();
          pdf.setFont("Verdana", "normal").setFontSize(16);
          y = margin;
        }
        pdf.text(line, margin, y, { align: "justify" });
        y += lineHeight;
      }
    }
  }
}

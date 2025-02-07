import { jsPDF } from 'jspdf';
import { convert } from 'html-to-text';
import { UserProject } from '../../../webui/src/app/types/userproject.js';

export class PdfCommon {
    readonly pdfMargin = 15;
    readonly pdfPageWidth = 210;
    readonly pdfPageHeight = 297;

    buildPdf(userContent: UserProject, resultPath?: string) {
        let pdfConverter = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [this.pdfPageWidth, this.pdfPageHeight]
        });

        pdfConverter.setFont("Verdana", "normal");

        this.addPdfTitle(pdfConverter, userContent.title, userContent.author, userContent.description);

        userContent.content.forEach((c) => {
            if (c !== undefined && c.isBook && !c.isFolder) {
                this.addPdfChapter(c.name, c.chapter !== undefined ? c.chapter : '', pdfConverter);
            }
        });

        if (resultPath !== undefined) {
            pdfConverter.save(resultPath);
            return undefined;
        } else {
            return pdfConverter.output();
        }
    }

    private addPdfTitle(pdfConverter: jsPDF, title: string, author: string, description: string) {
        // title
        pdfConverter.setFont("Verdana", "bold").setFontSize(22);
        pdfConverter.text(title, this.pdfPageWidth / 2, 25, { align: 'center' });
        pdfConverter.setFont("Verdana", "bold").setFontSize(18);
        pdfConverter.text(author, this.pdfPageWidth / 2, 40, { align: 'center' });

        // description
        let iterations = 1; // we need control the iterations of line
        const defaultYJump = 5; // default space btw lines
        const wrappedText = pdfConverter.splitTextToSize(description, this.pdfPageWidth - (this.pdfMargin * 2));
        pdfConverter.setFont("Verdana", "normal").setFontSize(14);
        wrappedText.forEach((line: string) => {
            let posY = this.pdfMargin + defaultYJump * iterations++;
            pdfConverter.text(line, 15, 100 + posY, { align: 'justify' });
        });

        // footer
        pdfConverter.setFont("Verdana", "normal").setFontSize(15);
        pdfConverter.text("© " + (new Date()).getFullYear() + " " + author, 15, 245, { align: 'left' });
        pdfConverter.setFont("Verdana", "italic").setFontSize(14);
        pdfConverter.text("Any copy or distribution without the author's consent is forbidden.", 15, 260, { align: 'left' });
        pdfConverter.setFont("Verdana", "bold").setFontSize(14);
        pdfConverter.text("Built with Writeepi (https://www.writeepi.com) " + (new Date()).toLocaleString(), 15, 270, { align: 'left' });
    }

    private addPdfChapter(title: string, content: string, pdfConverter: jsPDF) {
        pdfConverter.addPage();
        const options = {
            wordwrap: 999999
        };

        let iterations = 1; // we need control the iterations of line
        const defaultYJump = 5; // default space btw lines

        let posYTitle = this.pdfMargin + defaultYJump * iterations++;
        pdfConverter.setFont("Verdana", "bold").setFontSize(16);
        pdfConverter.text(title, this.pdfPageWidth / 2, posYTitle, { align: 'center' });
        iterations += 2;

        const textVersion = convert(content, options);
        const wrappedText = pdfConverter.splitTextToSize(textVersion, this.pdfPageWidth - (this.pdfMargin * 2));

        pdfConverter.setFont("Verdana", "normal").setFontSize(14);
        wrappedText.forEach((line: string) => {
            let posY = this.pdfMargin + defaultYJump * iterations++;
            if (posY > this.pdfPageHeight - this.pdfMargin) {
                pdfConverter.addPage();
                iterations = 1;
                posY = this.pdfMargin + defaultYJump * iterations++;
            }
            pdfConverter.text(line, 15, posY, { align: 'justify' });
        });
    }
}
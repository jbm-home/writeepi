import { AlignmentType, Document, ISectionOptions, Packer, Paragraph, ParagraphChild, Tab, TextRun } from "docx";
import { convert } from 'html-to-text';
import { UserProject } from '../../../webui/src/app/types/userproject.js';

export class DocxCommon {
    async buildDocx(userContent: UserProject): Promise<Buffer | undefined> {
        if (userContent === undefined) {
            return undefined;
        }

        const section: ISectionOptions = {
            properties: {},
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: {
                        before: 300,
                    },
                    children: [
                        new TextRun({
                            text: userContent.title,
                            bold: true,
                            size: 44,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: userContent.author,
                            bold: true,
                            size: 36,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: {
                        before: 2000,
                    },
                    children: [
                        new TextRun({
                            text: userContent.description,
                            bold: false,
                            size: 28,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: {
                        before: 2000,
                    },
                    children: [
                        new TextRun({
                            text: "© " + (new Date()).getFullYear() + " " + userContent.author,
                            bold: false,
                            size: 30,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: "Any copy or distribution without the author's consent is forbidden.",
                            bold: false,
                            italics: true,
                            size: 28,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                        new TextRun({
                            text: "Built with Writeepi (https://www.writeepi.com) " + (new Date()).toLocaleString(),
                            bold: true,
                            size: 28,
                        }),
                    ],
                }),
            ],
        };

        const chapters: ISectionOptions[] = [];
        chapters.push(section);
        const options = {
            wordwrap: 999999
        };

        userContent.content.forEach((c) => {
            if (c !== undefined && c.isBook && !c.isFolder) {
                const textVersion = convert(c.chapter !== undefined ? c.chapter : '', options);
                const lines: ParagraphChild[] = [];
                textVersion.split('\n').forEach((line) => {
                    lines.push(
                        new TextRun({
                            text: line,
                            bold: false,
                            size: 28,
                            break: 1
                        })
                    );
                });

                chapters.push(
                    {
                        properties: {},
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: c.name,
                                        bold: true,
                                        size: 36,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                spacing: {
                                    before: 600,
                                },
                                children: lines,
                            })
                        ]
                    }
                );
            }
        });

        const doc = new Document({
            sections: chapters
        });

        return await Packer.toBuffer(doc);
    }
}
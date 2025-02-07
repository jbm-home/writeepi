import { MariaDb } from "../../database/mariadb.js";
import bunyan from "bunyan";
import { UuidUtils } from '../../utils/uuidutils.js';
import { UserProject } from "../../../../webui/src/app/types/userproject.js"
import { EpubCommon } from '../../../../desktop/src/services/epubCommon.js';
import { PdfCommon } from '../../../../desktop/src/services/pdfCommon.js';
import { DocxCommon } from '../../../../desktop/src/services/docxCommon.js';

export class ExportService {
    log = bunyan.createLogger({ name: "Writeepi:Export", level: "debug" });

    async getEpub(req: any, httpRes: any) {
        const backup = await this.getBackup(req);
        if (backup !== undefined) {
            const buffer: Buffer = await (new EpubCommon()).buildEpub(backup);
            const mimeType = "application/epub+zip";
            httpRes.setHeader(
                "Content-Type",
                mimeType
            );

            httpRes.setHeader("Content-Disposition", 'attachment; filename="' + backup + '.epub"');
            return httpRes.send(buffer);
        }
        return httpRes.status(400).json('Bad request');
    }

    async getPdf(req: any, httpRes: any) {
        const backup = await this.getBackup(req);
        if (backup !== undefined) {
            const pdf = (new PdfCommon()).buildPdf(backup);
            if (pdf === undefined) {
                return httpRes.status(500).json('Server error');
            }
            const mimeType = "application/pdf; charset=utf-8";
            httpRes.setHeader(
                "Content-Type",
                mimeType
            );
            httpRes.setHeader("Content-Disposition", 'attachment; filename="' + backup + '.pdf"');
            return httpRes.send(pdf);
        }
        return httpRes.status(400).json('Bad request');
    }

    async getDocx(req: any, httpRes: any) {
        const backup = await this.getBackup(req);
        if (backup !== undefined) {
            const buffer: Buffer | undefined = await (new DocxCommon()).buildDocx(backup);
            if (buffer === undefined) {
                return httpRes.status(500).json('Server error');
            }
            const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            httpRes.setHeader(
                "Content-Type",
                mimeType
            );
            httpRes.setHeader("Content-Disposition", 'attachment; filename="' + backup + '.docx"');
            return httpRes.send(buffer);
        }
        return httpRes.status(400).json('Bad request');
    }

    private async getBackup(req: any) {
        const contentUid = await MariaDb.escape(req.params.uid);
        const userUid = await MariaDb.escape(req.session.uid);

        if (UuidUtils.isValidUuid(req.params.uid) && UuidUtils.isValidUuid(req.session.uid)) {
            const res = await MariaDb.request(`SELECT * FROM \`user_content\` WHERE \`id\` = ${contentUid} AND \`userId\` = ${userUid} ORDER BY \`updatedAt\` DESC;`);
            if (res.length > 0) {
                const result: UserProject = {
                    id: res[0].id,
                    userId: res[0].userId,
                    lang: res[0].lang,
                    title: res[0].title,
                    description: res[0].description,
                    author: res[0].author,
                    settings: JSON.parse(res[0].settings),
                    content: JSON.parse(res[0].content),
                    createdAt: res[0].createdAt,
                    updatedAt: res[0].updatedAt,
                };
                return result;
            }
        }
        return undefined;
    }
}
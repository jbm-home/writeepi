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
            return await (new EpubCommon()).buildEpub(backup);
        }
        return httpRes.status(400).json('Bad request');
    }

    async getPdf(req: any, httpRes: any) {
        const backup = await this.getBackup(req);
        if (backup !== undefined) {
            return await (new PdfCommon()).buildPdf(backup);
        }
        return httpRes.status(400).json('Bad request');
    }

    async getDocx(req: any, httpRes: any) {
        const backup = await this.getBackup(req);
        if (backup !== undefined) {
            return await (new DocxCommon()).buildDocx(backup);
        }
        return httpRes.status(400).json('Bad request');
    }

    private async getBackup(req: any) {
        const contentUid = await MariaDb.escape(req.params.uid);
        const userUid = await MariaDb.escape(req.session.uid);

        if (UuidUtils.isValidUuid(req.params.uid) && UuidUtils.isValidUuid(req.session.uid)) {
            const res = await MariaDb.request(`SELECT * FROM \`user_content\` WHERE \`id\` = ${contentUid} AND \`userId\` = ${userUid} ORDER BY \`updatedAt\` DESC;`);
            if (res.length > 0) {
                const result: UserProject = res[0];
                // result.settings = JSON.parse(result.settings);
                // result.content = JSON.parse(result.content);
                return result;
            }
        }
        return undefined;
    }
}
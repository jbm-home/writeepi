import { Postgres } from "../../database/postgres.js";
import bunyan from "bunyan";
import { UuidUtils } from "../../utils/uuidutils.js";
import { UserProject } from "../../../../webui/src/app/types/userproject.js";
import { EpubCommon } from "../../../../desktop/src/services/epubCommon.js";
import { PdfCommon } from "../../../../desktop/src/services/pdfCommon.js";
import { DocxCommon } from "../../../../desktop/src/services/docxCommon.js";

export class ExportService {
  log = bunyan.createLogger({ name: "Writeepi:Export", level: "debug" });

  async getEpub(req: any, httpRes: any) {
    const backup = await this.getBackup(req);
    if (backup !== undefined) {
      const buffer: Buffer = await new EpubCommon().buildEpub(backup);
      const mimeType = "application/epub+zip";
      httpRes.setHeader("Content-Type", mimeType);

      httpRes.setHeader(
        "Content-Disposition",
        'attachment; filename="' + backup + '.epub"',
      );
      return httpRes.send(buffer);
    }
    return httpRes.status(400).json("Bad request");
  }

  async getPdf(req: any, httpRes: any) {
    const backup = await this.getBackup(req);
    if (backup !== undefined) {
      const pdf = new PdfCommon().buildPdf(backup);
      if (pdf === undefined) {
        return httpRes.status(500).json("Server error");
      }
      const mimeType = "application/pdf";
      httpRes.setHeader("Content-Type", mimeType);
      httpRes.setHeader(
        "Content-Disposition",
        'attachment; filename="' + backup + '.pdf"',
      );
      return httpRes.send(pdf);
    }
    return httpRes.status(400).json("Bad request");
  }

  async getDocx(req: any, httpRes: any) {
    const backup = await this.getBackup(req);
    if (backup !== undefined) {
      const buffer: Buffer | undefined = await new DocxCommon().buildDocx(
        backup,
      );
      if (buffer === undefined) {
        return httpRes.status(500).json("Server error");
      }
      const mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      httpRes.setHeader("Content-Type", mimeType);
      httpRes.setHeader(
        "Content-Disposition",
        'attachment; filename="' + backup + '.docx"',
      );
      return httpRes.send(buffer);
    }
    return httpRes.status(400).json("Bad request");
  }

  private async getBackup(req: any): Promise<UserProject | undefined> {
    const contentUid = req.params.uid;
    const userUid = req.session.uid;

    if (UuidUtils.isValidUuid(contentUid) && UuidUtils.isValidUuid(userUid)) {
      const res = await Postgres.query<UserProject>(
        `SELECT *
               FROM user_content
              WHERE id = $1 AND user_id = $2
              ORDER BY updated_at DESC
              LIMIT 1`,
        [contentUid, userUid],
      );

      if (res.length > 0) {
        return res[0];
      }
    }
    return undefined;
  }
}

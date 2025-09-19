import { Postgres } from "../../database/postgres.js";
import bunyan from "bunyan";
import { UuidUtils } from "../../utils/uuidutils.js";
import { UserProject } from "../../../../webui/src/app/types/userproject.js";
import { DefaultProject } from "../../../../webui/src/app/types/defaultproject.js";
import { fileTypeFromBuffer } from 'file-type';
import { config } from "../../config.js";

export class BackupService {
  log = bunyan.createLogger({ name: "Writeepi:Backup", level: "debug" });

  async getbackuplist(req: any, httpRes: any) {
    const userUid = req.session.uid;

    if (UuidUtils.isValidUuid(userUid)) {
      const res = await Postgres.query<UserProject>(
        `SELECT id, user_id, updated_at, lang, title
                   FROM user_content
                  WHERE user_id = $1
                  ORDER BY updated_at DESC`,
        [userUid],
      );

      return httpRes.status(200).json(res ?? []);
    }
    return httpRes.status(400).json("Bad request");
  }

  async getbackup(req: any, httpRes: any) {
    const contentUid = req.params.uid;
    const userUid = req.session.uid;

    if (UuidUtils.isValidUuid(contentUid) && UuidUtils.isValidUuid(userUid)) {
      const row = await Postgres.queryOne(
        `SELECT *
                   FROM user_content
                  WHERE id = $1 AND user_id = $2
                  ORDER BY updated_at DESC
                  LIMIT 1`,
        [contentUid, userUid],
      );
      if (row) {
        const result: UserProject = {
          id: row.id,
          userId: row.user_id,
          lang: row.lang,
          title: row.title,
          description: row.description,
          author: row.author,
          settings: row.settings,
          content: row.content,
          wordStats: row.wordstats,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        return httpRes.status(200).json(result);
      }
    }
    return httpRes.status(400).json("Bad request");
  }

  async savebackup(req: any, httpRes: any) {
    const userUid = req.session.uid;
    const contentId = req.body.id;

    if (!(UuidUtils.isValidUuid(userUid) && UuidUtils.isValidUuid(contentId))) {
      return httpRes.status(400).json("Bad request");
    }

    const current = await Postgres.queryOne(
      `SELECT *
       FROM user_content
      WHERE id = $1 AND user_id = $2`,
      [contentId, userUid]
    );

    if (!current) {
      return httpRes.status(404).json("Content not found");
    }

    const recent = await Postgres.queryOne(
      `SELECT 1
       FROM user_content_history
      WHERE user_content_id = $1
        AND created_at > now() - interval '10 minutes'
      LIMIT 1`,
      [contentId]
    );

    if (!recent) {
      await Postgres.querySimple(
        `INSERT INTO user_content_history (
        id, user_content_id, user_id, lang, title, description,
        author, settings, content, wordstats, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())`,
        [
          UuidUtils.v7(),
          current.id,
          current.user_id,
          current.lang,
          current.title,
          current.description,
          current.author,
          JSON.stringify(req.body.settings),
          JSON.stringify(req.body.content),
          JSON.stringify(req.body.wordStats),
        ]
      );
    }

    // Main update
    await Postgres.querySimple(
      `UPDATE user_content
        SET lang = $1,
            title = $2,
            author = $3,
            description = $4,
            settings = $5,
            content = $6,
            wordstats = $7,
            updated_at = now()
      WHERE id = $8 AND user_id = $9`,
      [
        req.body.lang,
        req.body.title,
        req.body.author,
        req.body.description,
        JSON.stringify(req.body.settings),
        JSON.stringify(req.body.content),
        JSON.stringify(req.body.wordStats),
        contentId,
        userUid,
      ]
    );

    return httpRes.status(200).json(contentId);
  }

  async saveCover(req: any, httpRes: any) {
    const userUid = req.session.uid;
    const contentId = req.body.id;
    const imageBase64 = req.body.data;  // base64

    if (!(UuidUtils.isValidUuid(userUid) && UuidUtils.isValidUuid(contentId))) {
      return httpRes.status(400).json("Bad request");
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(imageBase64, "base64");
    } catch (e) {
      return httpRes.status(400).json("Invalid image encoding");
    }

    // < MAX_COVER_SIZE Mo
    const MAX_SIZE = config.MAX_COVER_SIZE * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return httpRes.status(400).json(`Image too large (max ${config.MAX_COVER_SIZE}MB)`);
    }

    const type = await fileTypeFromBuffer(buffer);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!type || !allowedTypes.includes(type.mime)) {
      return httpRes.status(400).json("Unsupported image format");
    }

    const mimeType = type.mime;

    const check = await Postgres.queryOne(
      `SELECT 1 FROM user_content WHERE id = $1 AND user_id = $2`,
      [contentId, userUid]
    );
    if (!check) {
      return httpRes.status(403).json("Not allowed");
    }

    await Postgres.querySimple(
      `INSERT INTO user_content_cover (user_content_id, mime_type, data, created_at, updated_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (user_content_id)
     DO UPDATE SET mime_type = EXCLUDED.mime_type,
                   data = EXCLUDED.data,
                   updated_at = now()`,
      [contentId, mimeType, buffer]
    );

    return httpRes.status(200).json({ success: true });
  }

  async getCover(req: any, httpRes: any) {
    const userUid = req.session.uid;
    const contentId = req.params.id;

    if (!(UuidUtils.isValidUuid(userUid) && UuidUtils.isValidUuid(contentId))) {
      return httpRes.status(400).json("Bad request");
    }

    const check = await Postgres.queryOne(
      `SELECT 1 FROM user_content WHERE id = $1 AND user_id = $2`,
      [contentId, userUid]
    );
    if (!check) {
      return httpRes.status(403).json("Not allowed");
    }

    const cover = await Postgres.queryOne(
      `SELECT mime_type, data
       FROM user_content_cover
      WHERE user_content_id = $1`,
      [contentId]
    );

    if (!cover) {
      return httpRes.status(404).json("Cover not found");
    }

    const base64 = cover.data.toString("base64");
    const dataUrl = `data:${cover.mime_type};base64,${base64}`;

    return httpRes.json({ cover: dataUrl });
  }

  async createProject(req: any, httpRes: any) {
    const userUid = req.session.uid;

    if (UuidUtils.isValidUuid(userUid)) {
      const project: UserProject = DefaultProject.buildDefaultProject();
      project.userId = userUid;

      await Postgres.querySimple(
        `INSERT INTO user_content
                    (id, user_id, lang, title, author, description, settings, content)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          project.id,
          project.userId,
          project.lang,
          project.title,
          project.author,
          project.description,
          JSON.stringify(project.settings),
          JSON.stringify(project.content),
        ],
      );

      return httpRes.status(200).json(project);
    }
    return httpRes.status(400).json("Bad request");
  }
}

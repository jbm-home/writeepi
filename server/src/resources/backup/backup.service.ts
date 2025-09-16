import { Postgres } from '../../database/postgres.js';
import bunyan from "bunyan";
import { UuidUtils } from '../../utils/uuidutils.js';
import { UserProject } from "../../../../webui/src/app/types/userproject.js";
import { DefaultProject } from "../../../../webui/src/app/types/defaultproject.js";

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
    return httpRes.status(400).json('Bad request');
  }

  async getbackup(req: any, httpRes: any) {
    const contentUid = req.params.uid;
    const userUid = req.session.uid;

    if (UuidUtils.isValidUuid(contentUid) && UuidUtils.isValidUuid(userUid)) {
      const row = await Postgres.queryOne<UserProject>(
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
          userId: row.userId,
          lang: row.lang,
          title: row.title,
          description: row.description,
          author: row.author,
          settings: row.settings,
          content: row.content,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
        return httpRes.status(200).json(result);
      }
    }
    return httpRes.status(400).json('Bad request');
  }

  async savebackup(req: any, httpRes: any) {
    const userUid = req.session.uid;
    const contentId = req.body.id;

    if (UuidUtils.isValidUuid(userUid) && UuidUtils.isValidUuid(contentId)) {
      await Postgres.querySimple(
        `UPDATE user_content
                    SET lang = $1,
                        title = $2,
                        author = $3,
                        description = $4,
                        settings = $5,
                        content = $6,
                        updated_at = now()
                  WHERE id = $7 AND user_id = $8`,
        [
          req.body.lang,
          req.body.title,
          req.body.author,
          req.body.description,
          JSON.stringify(req.body.settings),
          JSON.stringify(req.body.content),
          contentId,
          userUid,
        ],
      );
      return httpRes.status(200).json(contentId);
    }
    return httpRes.status(400).json('Bad request');
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
    return httpRes.status(400).json('Bad request');
  }
}

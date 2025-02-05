import { MariaDb } from "../../database/mariadb.js";
import bunyan from "bunyan";
import { UuidUtils } from '../../utils/uuidutils.js';
import { UserProject } from "../../../../webui/src/app/types/userproject.js"

export class BackupService {
    log = bunyan.createLogger({ name: "Writeepi:Backup", level: "debug" });

    async getbackuplist(req: any, httpRes: any) {
        const userUid = await MariaDb.escape(req.session.uid);

        if (UuidUtils.isValidUuid(req.session.uid)) {
            const res = await MariaDb.request(`SELECT * FROM \`user_content\` WHERE \`userId\` = ${userUid} ORDER BY \`updatedAt\` DESC;`);
            if (res.length > 0) {
                const result: any = res.map((uc: UserProject) => { return { uuid: uc.id, userId: uc.userId, savedate: uc.updatedAt, lang: uc.lang, title: uc.title } });
                return httpRes.status(200).json(result);
            }
        }
        return httpRes.status(400).json('Bad request');
    }

    async getbackup(req: any, httpRes: any) {
        const contentUid = await MariaDb.escape(req.params.uid);
        const userUid = await MariaDb.escape(req.session.uid);

        if (UuidUtils.isValidUuid(req.params.uid) && UuidUtils.isValidUuid(req.session.uid)) {
            const res = await MariaDb.request(`SELECT * FROM \`user_content\` WHERE \`id\` = ${contentUid} AND \`userId\` = ${userUid} ORDER BY \`updatedAt\` DESC;`);
            if (res.length > 0) {
                const result: UserProject = res[0];
                // result.settings = JSON.parse(result.settings);
                // result.content = JSON.parse(result.content);
                return httpRes.status(200).json(result);
            }
        }
        return httpRes.status(400).json('Bad request');
    }

    async savebackup(req: any, httpRes: any) {
        const userUid = await MariaDb.escape(req.session.uid);

        const lang = await MariaDb.escape(req.body.lang ?? 'en');
        const title = await MariaDb.escape(req.body.title ?? '');
        const author = await MariaDb.escape(req.body.author ?? '');

        const settings = await MariaDb.escape(JSON.stringify(req.body.settings));
        const content = await MariaDb.escape(JSON.stringify(req.body.content));

        // todo: validate content

        if (UuidUtils.isValidUuid(req.session.uid)) {
            if (req.body.uuid === undefined) {
                const uuid = UuidUtils.v7();
                await MariaDb.request(`INSERT INTO \`user_content\` (\`id\`, \`userId\`, \`lang\`, \`title\`, \`author\`, \`settings\`, \`content\`) VALUES(${uuid}, ${userUid}, ${lang}, ${title}, ${author}, ${settings}, ${content});`);
                return httpRes.status(200).json({ uuid });

            } else if (UuidUtils.isValidUuid(req.body.uuid)) {
                const uuid = await MariaDb.escape(req.body.uuid);
                // TODO: backup previous entry
                await MariaDb.request(`UPDATE \`user_content\` SET \`lang\` = ${lang}, \`title\` = ${title}, \`author\` = ${author}, \`settings\` = ${settings}, \`content\` = ${content} WHERE \`id\` = ${uuid} AND \`userId\` = ${userUid} LIMIT 1;`);
                return httpRes.status(200).json({ uuid: req.body.uuid });
            }
        }
        return httpRes.status(400).json('Bad request');
    }
}
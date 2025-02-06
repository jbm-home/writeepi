import { MariaDb } from "../../database/mariadb.js";
import bunyan from "bunyan";
import { UuidUtils } from '../../utils/uuidutils.js';
import { UserProject, UserProjectTemplate } from "../../../../webui/src/app/types/userproject.js"

export class BackupService {
    log = bunyan.createLogger({ name: "Writeepi:Backup", level: "debug" });

    async getbackuplist(req: any, httpRes: any) {
        const userUid = await MariaDb.escape(req.session.uid);

        if (UuidUtils.isValidUuid(req.session.uid)) {
            const res = await MariaDb.request(`SELECT * FROM \`user_content\` WHERE \`userId\` = ${userUid} ORDER BY \`updatedAt\` DESC;`);
            if (res.length > 0) {
                const result: any = res.map((uc: UserProject) => { return { id: uc.id, userId: uc.userId, updatedAt: uc.updatedAt, lang: uc.lang, title: uc.title } });
                return httpRes.status(200).json(result);
            } else {
                return httpRes.status(200).json([]);
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
                return httpRes.status(200).json(result);
            }
        }
        return httpRes.status(400).json('Bad request');
    }

    async savebackup(req: any, httpRes: any) {
        if (UuidUtils.isValidUuid(req.session.uid) && req.body.id !== undefined && UuidUtils.isValidUuid(req.body.id)) {
            const lang = await MariaDb.escape(req.body.lang);
            const title = await MariaDb.escape(req.body.title);
            const author = await MariaDb.escape(req.body.author);
            const description = await MariaDb.escape(req.body.description);

            const settings = await MariaDb.escape(JSON.stringify(req.body.settings));
            const content = await MariaDb.escape(JSON.stringify(req.body.content));

            const uid = await MariaDb.escape(req.session.uid);
            const id = await MariaDb.escape(req.body.id);
            // TODO: backup previous entry
            await MariaDb.request(`UPDATE \`user_content\` SET \`lang\` = ${lang}, \`title\` = ${title}, \`author\` = ${author}, \`description\` = ${description}, \`settings\` = ${settings}, \`content\` = ${content}, \`updatedAt\` = current_timestamp() WHERE \`id\` = ${id} AND \`userId\` = ${uid} LIMIT 1;`);
            return httpRes.status(200).json({ uuid: req.body.uuid });
        }
        return httpRes.status(400).json('Bad request');
    }

    async createProject(req: any, httpRes: any) {
        const userUid = await MariaDb.escape(req.session.uid);

        if (UuidUtils.isValidUuid(req.session.uid)) {
            const project = UserProjectTemplate.DEFAULT_PROJECT;
            project.userId = userUid;
            await MariaDb.request(`INSERT INTO \`user_content\` (\`id\`, \`userId\`, \`lang\`, \`title\`, \`author\`, \`description\`, \`settings\`, \`content\`) VALUES(
                    ${await MariaDb.escape(project.id)},
                    ${userUid},
                    ${await MariaDb.escape(project.lang)},
                    ${await MariaDb.escape(project.title)},
                    ${await MariaDb.escape(project.author)},
                    ${await MariaDb.escape(project.description)},
                    ${await MariaDb.escape(JSON.stringify(project.settings))},
                    ${await MariaDb.escape(JSON.stringify(project.content))}
                    );`);
            return httpRes.status(200).json(project);
        }
        return httpRes.status(400).json('Bad request');
    }
}
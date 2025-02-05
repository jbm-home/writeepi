import db from 'mariadb'
import { config } from '../config.js'
import { Database } from '../migrations/dbversions.js';
import fs from 'fs';
import path from 'path';
import CryptoJS from "crypto-js";
import bunyan from "bunyan";
import { Mailer } from "../utils/mailer.js";
import { mails } from "../templates/mails.js";
import { UuidUtils } from '../utils/uuidutils.js';
import { fileURLToPath } from "url";

export class MariaDb {
    static log = bunyan.createLogger({ name: "Writeepi:MariaDb", level: "debug" });

    public static readonly POOL = db.createPool({
        host: config.DB_HOST,
        port: config.DB_PORT,
        database: config.DB_NAME,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        connectionLimit: 100,
        // minimumIdle: 15
    });

    public static prepare = (async () => {
        this.log.info('Executing database migrations');
        let connection;
        try {
            connection = await this.POOL.getConnection();
            for (let element of Database.migrations) {
                let rows;
                let noSuchTable = false;
                try {
                    rows = await connection.query("SELECT * FROM versions WHERE version = ?", [element.version]);
                } catch (err: any) {
                    if (err.code == 'ER_NO_SUCH_TABLE') {
                        this.log.info('Table "versions" does not exist');
                        noSuchTable = true;
                    }
                }

                if (noSuchTable || (rows.length !== undefined && rows.length < 1)) {
                    this.log.debug(`Executing migration: ${element.version} ${element.description}`);
                    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
                    const __filename = fileURLToPath(import.meta.url);
                    const __dirname = path.dirname(__filename);
                    const filePath = path.join(__dirname, '../updates', element.file);
                    const content = fs.readFileSync(filePath).toString();
                    for (const query of content.split(';')) {
                        if (query.length > 0) {
                            await connection.query(query.trim() + ';');
                        }
                    }
                    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
                    await connection.query('INSERT INTO `versions` (`version`, `description`) VALUES (?, ?)', [element.version, element.description]);
                }
            };
            this.log.info('Database migrations done');
            try {
                const users = await connection.query("SELECT * FROM users WHERE email = 'noreply@writeepi.com'");
                if (users.length < 1) {
                    this.log.info('Creating admin user "noreply@writeepi.com" with password "changeit"');
                    await this.createUser('Admin', 'Admin', 'noreply@writeepi.com', 'changeit', '+33600000000', config.LEVEL.ADMIN);
                }
            } catch (err: any) {
                this.log.error('Cannot create user');
            }
        } catch (err) {
            this.log.error('General database error: ' + err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });

    public static request = (async (req: string) => {
        let connection;
        let res = [];
        try {
            connection = await this.POOL.getConnection();
            res = await connection.query(req);
        } catch (err) {
            this.log.error('Request error: ' + err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
        return res;
    });

    public static escape = (async (data: string) => {
        let connection;
        let escaped;
        try {
            connection = await this.POOL.getConnection();
            escaped = connection.escape(data);
        } finally {
            if (connection) {
                connection.release();
            }
        }
        return escaped;
    });

    public static createUser = (async (firstname: string, lastname: string, email: string, password: string, phone: string, level: number) => {
        let connection;
        let successful = false;
        email = email.toLowerCase();
        try {
            connection = await this.POOL.getConnection();
            const users = await connection.query("SELECT * FROM `users` WHERE `email` = ?", [email]);
            if (users.length < 1) {
                const newUuid = UuidUtils.v7();
                const recoverToken = UuidUtils.v7();
                const encryptedPwd = CryptoJS.AES.encrypt(`${email}:${password}`, config.DB_SECRET).toString();
                const url = `${config.SITE_URL}/recover?token=${recoverToken}`;
                const message1 = `Votre compte Writeepi a bien été créé !<br>Vous pouvez dés à présent vous connecter en suivant cette adresse : ${config.SITE_URL}`;
                const message2 = `Vous pouvez également changer votre mot de passe en suivant ce lien. Celui-ci expirera dans ${config.RESET_MAX_HOUR} heures : ${url}`;
                const mailSent = await Mailer.SendMail(email, 'Création de votre compte Writeepi', message1, mails.template(message1, message2, 'Création de votre compte Writeepi', 'Ouvrir Writeepi', config.SITE_URL));
                if (mailSent) {
                    await connection.query('INSERT INTO `users` (`uuid`, `firstname`, `lastname`, `email`, `password`, `resetKey`, `phone`, `level`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [newUuid, firstname, lastname, email, encryptedPwd, recoverToken, phone, level]);
                    this.log.debug('User created successfully');
                    successful = true;
                } else {
                    this.log.error('Cannot create user: mail not sent');
                }
            }
        } catch (err: any) {
            this.log.error('Cannot create user: ' + err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
        return successful;
    });
}
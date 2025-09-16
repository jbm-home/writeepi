import { Pool } from 'pg';
import { config } from '../config.js';
import { Database } from './dbversions.js';
import fs from 'fs';
import path from 'path';
import bunyan from "bunyan";
import { Mailer } from '../utils/mailer.js';
import { MailTemplate } from '../templates/mailtemplate.js';
import { UuidUtils } from '../utils/uuidutils.js';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

export class Postgres {
  static log = bunyan.createLogger({ name: "Writeepi:Postgres", level: "debug" });

  private static pool: Pool;

  private static getPool(): Pool {
    if (!this.pool) {
      this.log.info(
        `Creating PostgreSQL connection pool on ${config.DB_HOST}:${config.DB_PORT}`,
      );
      this.pool = new Pool({
        host: config.DB_HOST,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME,
        port: config.DB_PORT,
        max: 100,
      });
    }
    return this.pool;
  }

  public static async query<T = any>(
    query: string,
    values?: any[],
  ): Promise<T[]> {
    let client;
    try {
      client = await this.getPool().connect();
      const result = await client.query(query, values);
      return result.rows.length > 0 ? result.rows : [];
    } catch (err) {
      this.log.error('Request error: ' + err);
      return [];
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public static async queryOne<T = any>(
    query: string,
    values?: any[],
  ): Promise<T | null> {
    let client;
    try {
      client = await this.getPool().connect();
      const result = await client.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (err) {
      this.log.error('queryOne error: ' + err);
      return null;
    } finally {
      client?.release();
    }
  }

  public static async queryHasResult(
    query: string,
    values?: any[],
  ): Promise<boolean> {
    const res = await this.queryOne(query, values);
    return res !== null;
  }

  public static async querySimple(
    query: string,
    values?: any[],
  ): Promise<void> {
    let client;
    try {
      client = await this.getPool().connect();
      await client.query(query, values);
    } catch (err) {
      this.log.error('Request error: ' + err);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public static async queryAffected(
    query: string,
    values?: any[],
  ): Promise<number> {
    let client;
    try {
      client = await this.getPool().connect();
      const result = await client.query(query, values);
      return result.rowCount ?? 0;
    } catch (err) {
      this.log.error('Request error: ' + err);
      return 0;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public static prepare = async () => {
    this.log.info('Executing database migrations');
    let client;
    try {
      const pool = this.getPool();
      client = await pool.connect();
      for (const element of Database.migrations) {
        let rows;
        let noSuchTable = false;
        try {
          rows = await client.query(
            'SELECT * FROM versions WHERE version = $1',
            [element.version],
          );
        } catch (err: any) {
          if (err.code === '42P01') {
            // PostgreSQL "undefined_table"
            this.log.info('Table "versions" does not exist');
            noSuchTable = true;
          } else {
            throw err;
          }
        }

        if (noSuchTable || !rows?.rowCount) {
          this.log.debug(
            `Executing migration: ${element.version} ${element.description}`,
          );
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const filePath = path.join(__dirname, './migrations', element.file);
          const content = fs.readFileSync(filePath).toString();

          for (const query of content.split(';')) {
            if (query.trim().length > 5) {
              this.log.debug(`Executing query`);
              await client.query(query.trim() + ';');
            }
          }

          this.log.debug(`Updating version database: ${element.version}`);
          await client.query(
            'INSERT INTO versions (version, description) VALUES ($1, $2)',
            [element.version, element.description],
          );
        }
      }

      this.log.info('Database migrations done');

      try {
        const users = await client.query('SELECT * FROM users LIMIT 1');
        if (!users.rowCount) {
          this.log.info(
            'Creating admin user "noreply@writeepi.com" with password "changeit"',
          );
          await this.createUser(
            'Admin',
            'Admin',
            'noreply@writeepi.com',
            'changeit',
            '+33600000000',
            config.LEVEL.ADMIN,
          );
        }
      } catch (err: any) {
        this.log.error('Cannot create user: ' + err);
      }
    } catch (err) {
      this.log.error('General database error: ' + err);
    } finally {
      if (client) {
        client.release();
      }
    }
  };

  public static createUser = async (
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    phone: string,
    level: number,
  ): Promise<boolean> => {
    let client;
    let successful = false;
    email = email.toLowerCase();

    try {
      client = await this.getPool().connect();

      const users = await client.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);

      if (users.rowCount === 0) {
        const newUuid = UuidUtils.v7();
        const recoverToken = UuidUtils.v7();
        const encryptedPwd = await bcrypt.hash(`${email}:${password}`, 10);

        const url = `${config.SITE_URL}/recover?token=${recoverToken}`;
        const message1 = `Your Writeepi account has been successfully created!<br>You can now log in by following this link: ${config.SITE_URL}`;
        const message2 = `You can also change your password by following this link. It will expire in ${config.RESET_MAX_HOUR} hours: ${url}`;

        await client.query(
          `INSERT INTO users
                  (uuid, firstname, lastname, email, password, resetKey, phone, level)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            newUuid,
            firstname,
            lastname,
            email,
            encryptedPwd,
            recoverToken,
            phone,
            level,
          ],
        );

        this.log.debug('User created successfully');
        successful = true;

        await Mailer.SendMail(
          email,
          'Your Writeepi Account Has Been Created',
          message1,
          MailTemplate.build(
            message1,
            message2,
            'Your Writeepi Account Has Been Created',
            'Open Writeepi',
            config.SITE_URL,
          ),
        );
      }
    } catch (err: any) {
      this.log.error('Cannot create user: ' + err);
    } finally {
      if (client) {
        client.release();
      }
    }

    return successful;
  };
}

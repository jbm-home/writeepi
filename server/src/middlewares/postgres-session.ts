import session, { SessionData } from 'express-session';
import bunyan from "bunyan";
import { Postgres } from '../database/postgres.js';

const noop = (arg1: any = undefined, arg2: any = undefined) => {};

export class PostgresStore extends session.Store {
  log = bunyan.createLogger({ name: "Writeepi:PostgresStore", level: "debug" });

  async get(sid: string, callback = noop) {
    try {
      const result = await Postgres.queryOne(
        `SELECT * FROM sessions WHERE sid = $1;`,
        [sid],
      );
      if (result) {
        callback(null, result.session);
      } else {
        callback(null, null);
      }
    } catch (err: any) {
      this.log.error('Get session: ' + err);
      callback(err);
    }
  }

  async set(sid: string, session: SessionData, callback = noop) {
    try {
      const expires = session.cookie.expires;
      await Postgres.querySimple(
        `INSERT INTO sessions (sid, session, expires)
         VALUES ($1, $2, $3)
         ON CONFLICT (sid)
         DO UPDATE SET session = EXCLUDED.session, lastSeen = NOW();`,
        [sid, session, expires],
      );
      callback();
    } catch (err: any) {
      this.log.error('Set session: ' + err);
      callback(err);
    }
  }

  async destroy(sid: string, callback = noop) {
    try {
      await Postgres.querySimple(`DELETE FROM sessions WHERE sid = $1;`, [sid]);
      callback();
    } catch (err: any) {
      this.log.error('Destroy session: ' + err);
      callback(err);
    }
  }

  override async clear(callback = noop) {
    try {
      await Postgres.querySimple(`DELETE FROM sessions`);
      callback();
    } catch (err: any) {
      this.log.error('Clear sessions: ' + err);
      callback(err);
    }
  }

  override async all(callback = noop) {
    try {
      const result = await Postgres.query(`SELECT * FROM sessions`);
      callback(null, result);
    } catch (err: any) {
      this.log.error('List sessions: ' + err);
      callback(err);
    }
  }

  override async length(callback = noop) {
    try {
      const result = await Postgres.queryOne(
        `SELECT count(*) AS count FROM sessions`,
      );
      callback(null, result?.count);
    } catch (err: any) {
      this.log.error('Count sessions: ' + err);
      callback(err);
    }
  }

  override touch(sid: string, session: SessionData, callback = noop) {
    this.set(sid, session, callback);
  }
}

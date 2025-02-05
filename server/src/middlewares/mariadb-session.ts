import session from 'express-session';
import bunyan from "bunyan";
import { MariaDb } from '../database/mariadb.js';

const noop = (arg1: any = undefined, arg2: any = undefined) => { }

export class MariaDBStore extends session.Store {
  log = bunyan.createLogger({ name: "Writeepi:MariaDBStore", level: "debug" });

  async get(sid: any, callback = noop) {
    try {
      sid = await MariaDb.escape(sid);
      const result = await MariaDb.request(`SELECT * FROM \`sessions\` WHERE \`sid\` = ${sid};`);
      if (result.length > 0) {
        callback(null, JSON.parse(result[0].session));
      } else {
        callback(null, null);
      }
    } catch (err: any) {
      this.log.error('Get session: ' + err);
      callback(err);
    }
  }

  async set(sid: any, session: any, callback = noop) {
    try {
      sid = await MariaDb.escape(sid);
      const sessionJson = await MariaDb.escape(JSON.stringify(session));
      await MariaDb.request(`INSERT INTO \`sessions\` (\`sid\`, \`session\`) VALUES(${sid}, ${sessionJson}) ON DUPLICATE KEY UPDATE session = ${sessionJson}, lastSeen = NOW();`);
      callback();
    } catch (err: any) {
      this.log.error('Set session: ' + err);
      callback(err);
    }
  }

  async destroy(sid: any, callback = noop) {
    try {
      sid = await MariaDb.escape(sid);
      await MariaDb.request(`DELETE FROM sessions WHERE sid = ${sid}`);
      callback();
    } catch (err: any) {
      this.log.error('Destroy session: ' + err);
      callback(err);
    }
  }

  override async clear(callback = noop) {
    try {
      await MariaDb.request(`DELETE FROM sessions`);
      callback();
    } catch (err: any) {
      this.log.error('Clear sessions: ' + err);
      callback(err);
    }
  }

  override async all(callback = noop) {
    try {
      const result = await MariaDb.request(`SELECT * FROM sessions`);
      callback(null, result);
    } catch (err: any) {
      this.log.error('List sessions: ' + err);
      callback(err);
    }
  }

  override async length(callback = noop) {
    try {
      const result = await MariaDb.request(`SELECT count(*) AS count FROM sessions`);
      callback(null, result[0].count);
    } catch (err: any) {
      this.log.error('Count sessions: ' + err);
      callback(err);
    }
  }

  async cleanOlds(interval: number) {
    if (Number.isInteger(interval) && interval > 0) {
      this.log.info(`Cleaning sessions older than ${interval} days`);
      const result = await MariaDb.request(`DELETE FROM sessions WHERE lastSeen < NOW() - INTERVAL ${interval} DAY`);
      this.log.info(`Deleted ${result.affectedRows} sessions`);
    } else {
      this.log.error(`Cannot clean old sessions (invalid interval)`);
    }
  }

  override touch(sid: any, session: any, callback = noop) {
    this.set(sid, session, callback)
  }
}

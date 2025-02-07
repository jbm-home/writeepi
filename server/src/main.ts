import cors from 'cors';
import express from 'express';
import proxy from 'express-http-proxy';
import cookieParser from "cookie-parser";
import sessions from 'express-session';
import { config } from './config.js';
import { SessionController } from './resources/users/session.controller.js';
import { ExceptionsHandler } from './middlewares/exceptions.handler.js';
import { UnknownRoutesHandler } from './middlewares/unknownRoutes.handler.js';
import { MariaDb } from './database/mariadb.js';
import bunyan from 'bunyan';
import moment from 'moment';
import { MariaDBStore } from './middlewares/mariadb-session.js'
import { ExportController } from './resources/export/export.controller.js';
import { Scheduler } from './utils/scheduler.js';
import { BackupController } from './resources/backup/backup.controller.js';
import { fileURLToPath } from 'url';
import path from 'path';

const log = bunyan.createLogger({ name: "Writeepi:Start", level: "debug" });
log.level(bunyan.DEBUG);
moment.locale('fr');

MariaDb.prepare();

const app = express();
const scheduler = new Scheduler();
const sessionStore = new MariaDBStore();
const ONEMINUTE = 1000 * 60;
const ONEHOUR = ONEMINUTE * 60;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webpath = __dirname + '/../../webui/dist/webui/browser/';

scheduler.Schedule(
    'Session Cleaner',
    () => { sessionStore.cleanOlds(config.SESSION_DURATION_DAYS + 1) },
    ONEHOUR * 6,
    ONEMINUTE
);

app.use(express.json({ limit: 104857600 }));
app.use(cors());
app.use(sessions({
    secret: config.COOKIE_SECRET,
    store: sessionStore,
    saveUninitialized: true,
    cookie: { maxAge: ONEHOUR * 24 * config.SESSION_DURATION_DAYS },
    resave: false
}));
app.use(cookieParser());
app.use('/api/session', SessionController);
app.use('/api/export', ExportController);
app.use('/api/content', BackupController);
if (process.env['PROFILE']?.trim() === 'DEV') {
    log.warn("Starting in dev mode");
    app.use('/', proxy('http://localhost:4200'));
} else {
    log.info("Starting in normal mode");
    app.use('/', express.static(webpath));
}

app.all('*', UnknownRoutesHandler);
app.use(ExceptionsHandler);

log.info('Web path: ' + webpath);
app.listen(config.API_PORT, 'localhost', () => log.info('Server is running on port ' + config.API_PORT));

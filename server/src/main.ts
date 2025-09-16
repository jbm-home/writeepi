import cors from "cors";
import express from "express";
import proxy from "express-http-proxy";
import cookieParser from "cookie-parser";
import sessions from "express-session";
import { config } from "./config.js";
import { SessionController } from "./resources/users/session.controller.js";
import { ExceptionsHandler } from "./middlewares/exceptions.handler.js";
import { UnknownRoutesHandler } from "./middlewares/unknownRoutes.handler.js";
import { Postgres } from "./database/postgres.js";
import bunyan from "bunyan";
import moment from "moment";
import { PostgresStore } from "./middlewares/postgres-session.js";
import { ExportController } from "./resources/export/export.controller.js";
import { Scheduler } from "./utils/scheduler.js";
import { BackupController } from "./resources/backup/backup.controller.js";
import { fileURLToPath } from "url";
import path from "path";
import { CaptchaController } from "./resources/captcha/captcha.controller.js";

const log = bunyan.createLogger({ name: "Writeepi:Start", level: "debug" });
log.level(bunyan.DEBUG);
moment.locale("fr");

Postgres.prepare();

const app = express();
const scheduler = new Scheduler();
const sessionStore = new PostgresStore();
const ONEMINUTE = 1000 * 60;
const ONEHOUR = ONEMINUTE * 60;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webpath = __dirname + "/../../webui/browser/";

scheduler.Schedule(
  "Session cleaner",
  () => {
    Postgres.querySimple(
      `DELETE FROM sessions WHERE expires < now() - interval '1 day' OR lastSeen < now() - ($1 * interval '1 day')`,
      [config.SESSION_DURATION_DAYS],
    );
  },
  ONEHOUR * 24,
  ONEMINUTE * 3,
);

const tmpVer = process.env["npm_package_version"];
const regexSemver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/u;
const version =
  tmpVer !== undefined && tmpVer != null && tmpVer.match(regexSemver)
    ? tmpVer
    : "";

app.set("json spaces", 0);
app.disable("x-powered-by");
app.use(express.json({ limit: 104_857_600 })); // 100MB
app.use(cors());
app.use(
  sessions({
    secret: config.COOKIE_SECRET,
    store: sessionStore,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: ONEHOUR * 24 * config.SESSION_DURATION_DAYS,
    },
  }),
);
app.use(cookieParser());

// Routes
app.use("/api/session", SessionController);
app.use("/api/export", ExportController);
app.use("/api/content", BackupController);
app.use("/api/captcha", CaptchaController);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    version,
  });
});
app.get("/api/version", (req, res) => {
  res.send(version);
});

if (process.env["PROFILE"]?.trim() === "DEV") {
  log.warn("Starting in dev mode");
  app.use("/", proxy("http://localhost:4200"));
} else {
  log.info("Starting in normal mode");
  app.use("/", express.static(webpath));
}

log.info("Server version: " + version);

// Unknown + error handlers
app.use(UnknownRoutesHandler);
app.use(ExceptionsHandler);

log.info("Web path: " + webpath);

app.listen(config.API_PORT, () =>
  log.info("Server is running on port " + config.API_PORT),
);

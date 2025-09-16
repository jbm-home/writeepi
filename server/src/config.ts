export const config = {
  SITE_URL: process.env["CONF_SITE_URL"] ?? "https://www.writeepi.com",
  API_PORT: process.env["CONF_API_PORT"]
    ? Number.parseInt(process.env["CONF_API_PORT"])
    : 8337,
  DB_HOST: process.env["CONF_DB_HOST"] ?? "127.0.0.1",
  DB_PORT: process.env["CONF_DB_PORT"]
    ? Number.parseInt(process.env["CONF_DB_PORT"])
    : 5432,
  DB_NAME: process.env["CONF_DB_NAME"] ?? "writeepi",
  DB_USER: process.env["CONF_DB_USER"] ?? "writeepi",
  DB_PASSWORD: process.env["CONF_DB_PASSWORD"] ?? "Changeit!",
  COOKIE_SECRET:
    process.env["CONF_COOKIE_SECRET"] ?? "32charactersforanencryptionkey22",
  RESET_MAX_HOUR: 2,
  SESSION_DURATION_DAYS: 8,
  EMAIL: {
    ENABLED: process.env["CONF_EMAIL_ENABLED"]
      ? process.env["CONF_EMAIL_ENABLED"] === "1"
      : false,
    SENDER:
      process.env["CONF_EMAIL_SENDER"] ?? "Writeepi <noreply@writeepi.com>",
    LOGIN: process.env["CONF_EMAIL_LOGIN"] ?? "noreply@writeepi.com",
    PASSWORD: process.env["CONF_EMAIL_PASSWORD"] ?? "changeit",
    HOST: process.env["CONF_EMAIL_HOST"] ?? "mailserver.host",
    PORT: process.env["CONF_EMAIL_PORT"]
      ? Number.parseInt(process.env["CONF_EMAIL_PORT"])
      : 587,
    SECURE: process.env["CONF_EMAIL_SECURE"]
      ? process.env["CONF_EMAIL_SECURE"] === "1"
      : false,
    TLS: process.env["CONF_EMAIL_TLS"]
      ? process.env["CONF_EMAIL_TLS"] === "1"
      : true,
  },
  LEVEL: {
    GUEST: 0,
    USER: 1,
    ADMIN: 2,
  },
};

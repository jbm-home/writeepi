export const config = {
    SITE_URL: 'https://www.writeepi.com',
    API_PORT: 8337,
    DB_HOST: '127.0.0.1',
    DB_PORT: 3306,
    DB_NAME: 'writeepi',
    DB_USER: 'writeepi',
    DB_PASSWORD: 'database_password',
    DB_SECRET: '32charactersforanencryptionkey11',
    COOKIE_SECRET: '32charactersforanencryptionkey22',
    RESET_MAX_HOUR: 2,
    SESSION_DURATION_DAYS: 8,
    EMAIL: {
      ENABLED: false,
      SENDER: 'Writeepi <noreply@writeepi.com>',
      LOGIN: 'noreply@writeepi.com',
      PASSWORD: 'changeit',
      HOST: 'mailserver.host',
      PORT: 587,
      SECURE: false,
      TLS: true
    },
    LEVEL: {
      GUEST: 0,
      USER: 1,
      ADMIN: 2
    }
  }
import type { Migrations } from "../types/migrations.js";

export class Database {
  static migrations: Migrations[] = [
    {
      version: 1,
      description: "Full database installation",
      file: "1_full.sql",
    },
    {
      version: 2,
      description: "Missing wordstats column in cloud mode",
      file: "2_wordstats.sql",
    },
    {
      version: 3,
      description: "Add user content history",
      file: "3_user_content_history.sql",
    },
    {
      version: 4,
      description: "Add user content cover",
      file: "4_user_content_cover.sql",
    },
  ];
}

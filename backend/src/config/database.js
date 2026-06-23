import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDirectory = path.resolve("data");

fs.mkdirSync(dataDirectory, {
  recursive: true,
});

const databasePath = path.join(
  dataDirectory,
  "weechat.db"
);

const database = new Database(databasePath);

database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");

console.log(`WeeChat database: ${databasePath}`);

export { databasePath };
export default database;

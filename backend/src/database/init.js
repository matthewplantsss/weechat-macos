import "dotenv/config";
import bcrypt from "bcryptjs";
import database from "../config/database.js";

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    status_message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_type TEXT NOT NULL DEFAULT 'direct'
      CHECK (conversation_type IN ('direct', 'group')),
    title TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id INTEGER,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id)
      REFERENCES conversations(id)
      ON DELETE CASCADE,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited_at TEXT,
    deleted_at TEXT,
    FOREIGN KEY (conversation_id)
      REFERENCES conversations(id)
      ON DELETE CASCADE,
    FOREIGN KEY (sender_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_id TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at);

  CREATE INDEX IF NOT EXISTS idx_participants_user
    ON conversation_participants(user_id);

  CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON user_sessions(user_id);

  CREATE TRIGGER IF NOT EXISTS update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  BEGIN
    UPDATE conversations
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
  END;
`);

function createDemoData() {
  const userCount = database
    .prepare(`
      SELECT COUNT(*) AS count
      FROM users
    `)
    .get();

  if (userCount.count > 0) {
    console.log(
      `Database already contains ${userCount.count} users.`
    );
    return;
  }

  const passwordHash = bcrypt.hashSync(
    "Password123!",
    12
  );

  const insertUser = database.prepare(`
    INSERT INTO users (
      display_name,
      username,
      email,
      password_hash,
      status_message
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const matthewResult = insertUser.run(
    "Matthew Plants",
    "matthew",
    "matthew@example.com",
    passwordHash,
    "Building WeeChat"
  );

  const averyResult = insertUser.run(
    "Avery Morgan",
    "avery",
    "avery@example.com",
    passwordHash,
    "Available"
  );

  const matthewId = Number(
    matthewResult.lastInsertRowid
  );

  const averyId = Number(
    averyResult.lastInsertRowid
  );

  const conversationResult = database
    .prepare(`
      INSERT INTO conversations (
        conversation_type,
        created_by
      )
      VALUES ('direct', ?)
    `)
    .run(matthewId);

  const conversationId = Number(
    conversationResult.lastInsertRowid
  );

  const addParticipant = database.prepare(`
    INSERT INTO conversation_participants (
      conversation_id,
      user_id
    )
    VALUES (?, ?)
  `);

  addParticipant.run(
    conversationId,
    matthewId
  );

  addParticipant.run(
    conversationId,
    averyId
  );

  database
    .prepare(`
      INSERT INTO messages (
        conversation_id,
        sender_id,
        message_text
      )
      VALUES (?, ?, ?)
    `)
    .run(
      conversationId,
      averyId,
      "Welcome to WeeChat. This is your first conversation."
    );

  console.log("Created two demo users.");
  console.log("Created one demo conversation.");
  console.log("Created one starter message.");
}

try {
  createDemoData();

  console.log(
    "WeeChat database initialization completed."
  );
} catch (error) {
  console.error(
    "WeeChat database initialization failed:",
    error
  );

  process.exitCode = 1;
} finally {
  database.close();
}

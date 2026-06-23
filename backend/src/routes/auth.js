import express from "express";
import bcrypt from "bcryptjs";
import database from "../config/database.js";
import { requireAuthentication } from "../middleware/auth.js";
import {
  createAccessToken,
  createTokenId,
  getTokenExpiration,
} from "../services/token.js";

const router = express.Router();

function serializeUser(user) {
  return {
    id: user.id,
    displayName: user.display_name,
    username: user.username,
    email: user.email,
    statusMessage: user.status_message,
    createdAt: user.created_at,
  };
}

function createSession(user) {
  const tokenId = createTokenId();
  const token = createAccessToken(user, tokenId);
  const expiresAt = getTokenExpiration(token);

  database
    .prepare(`
      INSERT INTO user_sessions (
        user_id,
        token_id,
        expires_at
      )
      VALUES (?, ?, ?)
    `)
    .run(user.id, tokenId, expiresAt);

  return {
    token,
    expiresAt,
  };
}

router.post("/login", async (req, res) => {
  const login = String(req.body.login || "")
    .trim()
    .toLowerCase();

  const password = String(req.body.password || "");

  if (!login || !password) {
    return res.status(400).json({
      message: "Username or email and password are required.",
    });
  }

  const user = database
    .prepare(`
      SELECT
        id,
        display_name,
        username,
        email,
        password_hash,
        status_message,
        created_at
      FROM users
      WHERE username = ?
         OR email = ?
    `)
    .get(login, login);

  if (!user) {
    return res.status(401).json({
      message: "The username, email, or password is incorrect.",
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    return res.status(401).json({
      message: "The username, email, or password is incorrect.",
    });
  }

  database
    .prepare(`
      DELETE FROM user_sessions
      WHERE datetime(expires_at) <= datetime('now')
    `)
    .run();

  const session = createSession(user);

  res.json({
    message: "Signed in successfully.",
    user: serializeUser(user),
    ...session,
  });
});

router.get("/me", requireAuthentication, (req, res) => {
  res.json({
    user: req.auth.user,
  });
});

router.post("/logout", requireAuthentication, (req, res) => {
  database
    .prepare(`
      DELETE FROM user_sessions
      WHERE token_id = ?
    `)
    .run(req.auth.tokenId);

  res.json({
    message: "Signed out successfully.",
  });
});

export default router;

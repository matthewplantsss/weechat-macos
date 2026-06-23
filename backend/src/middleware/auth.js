import database from "../config/database.js";
import { verifyAccessToken } from "../services/token.js";

export function requireAuthentication(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication is required.",
    });
  }

  const token = authorizationHeader
    .slice("Bearer ".length)
    .trim();

  try {
    const payload = verifyAccessToken(token);

    const session = database
      .prepare(`
        SELECT
          user_sessions.user_id,
          user_sessions.token_id,
          user_sessions.expires_at,
          users.display_name,
          users.username,
          users.email,
          users.status_message
        FROM user_sessions
        JOIN users
          ON users.id = user_sessions.user_id
        WHERE user_sessions.token_id = ?
          AND user_sessions.user_id = ?
          AND datetime(user_sessions.expires_at) > datetime('now')
      `)
      .get(payload.tokenId, Number(payload.sub));

    if (!session) {
      return res.status(401).json({
        message: "Your session is invalid or expired.",
      });
    }

    req.auth = {
      token,
      tokenId: session.token_id,
      user: {
        id: session.user_id,
        displayName: session.display_name,
        username: session.username,
        email: session.email,
        statusMessage: session.status_message,
      },
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Your authentication token is invalid or expired.",
    });
  }
}

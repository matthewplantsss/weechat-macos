import crypto from "node:crypto";
import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from the environment.");
  }

  return secret;
}

export function createTokenId() {
  return crypto.randomUUID();
}

export function createAccessToken(user, tokenId) {
  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
      tokenId,
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
      issuer: "weechat-server",
      audience: "weechat-client",
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: "weechat-server",
    audience: "weechat-client",
  });
}

export function getTokenExpiration(token) {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded.exp !== "number") {
    throw new Error("Token expiration could not be determined.");
  }

  return new Date(decoded.exp * 1000).toISOString();
}

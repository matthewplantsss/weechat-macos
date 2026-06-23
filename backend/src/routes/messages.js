import express from "express";
import database from "../config/database.js";
import { requireAuthentication } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuthentication);

function userCanAccessConversation(
  conversationId,
  userId
) {
  return Boolean(
    database
      .prepare(`
        SELECT 1
        FROM conversation_participants
        WHERE conversation_id = ?
          AND user_id = ?
      `)
      .get(conversationId, userId)
  );
}

function serializeMessage(message) {
  return {
    id: message.id,
    conversationId: message.conversation_id,

    sender: {
      id: message.sender_id,
      displayName: message.sender_display_name,
      username: message.sender_username,
    },

    text: message.message_text,
    createdAt: message.created_at,
    editedAt: message.edited_at,
    deletedAt: message.deleted_at,
  };
}

router.get("/:conversationId", (req, res) => {
  const conversationId = Number(
    req.params.conversationId
  );

  if (!Number.isInteger(conversationId)) {
    return res.status(400).json({
      message: "Invalid conversation ID.",
    });
  }

  if (
    !userCanAccessConversation(
      conversationId,
      req.auth.user.id
    )
  ) {
    return res.status(404).json({
      message: "Conversation not found.",
    });
  }

  const messages = database
    .prepare(`
      SELECT
        messages.id,
        messages.conversation_id,
        messages.sender_id,
        messages.message_text,
        messages.created_at,
        messages.edited_at,
        messages.deleted_at,

        users.display_name AS sender_display_name,
        users.username AS sender_username

      FROM messages

      JOIN users
        ON users.id = messages.sender_id

      WHERE messages.conversation_id = ?

      ORDER BY messages.id ASC
    `)
    .all(conversationId);

  res.json(messages.map(serializeMessage));
});

router.post("/:conversationId", (req, res) => {
  const conversationId = Number(
    req.params.conversationId
  );

  const messageText = String(
    req.body.messageText || ""
  ).trim();

  if (!Number.isInteger(conversationId)) {
    return res.status(400).json({
      message: "Invalid conversation ID.",
    });
  }

  if (
    !userCanAccessConversation(
      conversationId,
      req.auth.user.id
    )
  ) {
    return res.status(404).json({
      message: "Conversation not found.",
    });
  }

  if (!messageText) {
    return res.status(400).json({
      message: "Message text is required.",
    });
  }

  if (messageText.length > 4000) {
    return res.status(400).json({
      message:
        "Messages cannot exceed 4,000 characters.",
    });
  }

  try {
    const result = database
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
        req.auth.user.id,
        messageText
      );

    const message = database
      .prepare(`
        SELECT
          messages.id,
          messages.conversation_id,
          messages.sender_id,
          messages.message_text,
          messages.created_at,
          messages.edited_at,
          messages.deleted_at,

          users.display_name AS sender_display_name,
          users.username AS sender_username

        FROM messages

        JOIN users
          ON users.id = messages.sender_id

        WHERE messages.id = ?
      `)
      .get(Number(result.lastInsertRowid));

    res.status(201).json({
      message: serializeMessage(message),
    });
  } catch (error) {
    console.error("Unable to save message:", error);

    res.status(500).json({
      message: "Unable to send the message.",
    });
  }
});

export default router;

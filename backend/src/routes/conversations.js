import express from "express";
import database from "../config/database.js";
import { requireAuthentication } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuthentication);

router.get("/", (req, res) => {
  try {
    const conversations = database
      .prepare(`
        SELECT
          conversations.id,
          conversations.conversation_type,
          conversations.title,
          conversations.created_at,
          conversations.updated_at,

          other_user.id AS participant_id,
          other_user.display_name AS participant_display_name,
          other_user.username AS participant_username,
          other_user.status_message AS participant_status_message,

          last_message.id AS last_message_id,
          last_message.message_text AS last_message_text,
          last_message.sender_id AS last_message_sender_id,
          last_message.created_at AS last_message_created_at,

          last_sender.display_name AS last_message_sender_name

        FROM conversations

        JOIN conversation_participants AS current_participant
          ON current_participant.conversation_id = conversations.id
          AND current_participant.user_id = ?

        LEFT JOIN conversation_participants AS other_participant
          ON other_participant.conversation_id = conversations.id
          AND other_participant.user_id != ?

        LEFT JOIN users AS other_user
          ON other_user.id = other_participant.user_id

        LEFT JOIN messages AS last_message
          ON last_message.id = (
            SELECT id
            FROM messages
            WHERE conversation_id = conversations.id
              AND deleted_at IS NULL
            ORDER BY id DESC
            LIMIT 1
          )

        LEFT JOIN users AS last_sender
          ON last_sender.id = last_message.sender_id

        ORDER BY
          COALESCE(
            last_message.created_at,
            conversations.updated_at
          ) DESC
      `)
      .all(req.auth.user.id, req.auth.user.id);

    res.json(
      conversations.map((conversation) => ({
        id: conversation.id,
        type: conversation.conversation_type,
        title:
          conversation.conversation_type === "direct"
            ? conversation.participant_display_name
            : conversation.title || "Group conversation",

        participant: conversation.participant_id
          ? {
              id: conversation.participant_id,
              displayName:
                conversation.participant_display_name,
              username:
                conversation.participant_username,
              statusMessage:
                conversation.participant_status_message,
            }
          : null,

        lastMessage: conversation.last_message_id
          ? {
              id: conversation.last_message_id,
              text: conversation.last_message_text,
              senderId:
                conversation.last_message_sender_id,
              senderName:
                conversation.last_message_sender_name,
              createdAt:
                conversation.last_message_created_at,
            }
          : null,

        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      }))
    );
  } catch (error) {
    console.error(
      "Unable to retrieve conversations:",
      error
    );

    res.status(500).json({
      message: "Unable to retrieve conversations.",
    });
  }
});

router.get("/:conversationId", (req, res) => {
  const conversationId = Number(
    req.params.conversationId
  );

  if (!Number.isInteger(conversationId)) {
    return res.status(400).json({
      message: "Invalid conversation ID.",
    });
  }

  const conversation = database
    .prepare(`
      SELECT
        conversations.id,
        conversations.conversation_type,
        conversations.title,
        conversations.created_at,
        conversations.updated_at
      FROM conversations

      JOIN conversation_participants
        ON conversation_participants.conversation_id =
          conversations.id

      WHERE conversations.id = ?
        AND conversation_participants.user_id = ?
    `)
    .get(conversationId, req.auth.user.id);

  if (!conversation) {
    return res.status(404).json({
      message: "Conversation not found.",
    });
  }

  const participants = database
    .prepare(`
      SELECT
        users.id,
        users.display_name,
        users.username,
        users.status_message,
        conversation_participants.joined_at,
        conversation_participants.last_read_message_id

      FROM conversation_participants

      JOIN users
        ON users.id =
          conversation_participants.user_id

      WHERE conversation_participants.conversation_id = ?

      ORDER BY users.display_name
    `)
    .all(conversationId);

  res.json({
    id: conversation.id,
    type: conversation.conversation_type,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,

    participants: participants.map((participant) => ({
      id: participant.id,
      displayName: participant.display_name,
      username: participant.username,
      statusMessage: participant.status_message,
      joinedAt: participant.joined_at,
      lastReadMessageId:
        participant.last_read_message_id,
    })),
  });
});

export default router;

import {
  Send,
  UserRound,
} from "lucide-react";

export default function MessagePanel({
  conversation,
  messages,
  currentUser,
  messageText,
  onMessageChange,
  onSendMessage,
  isSending,
  isLoading,
}) {
  if (!conversation) {
    return (
      <section className="message-panel empty-panel">
        <div className="empty-chat-icon">
          <UserRound size={42} />
        </div>

        <h2>Select a conversation</h2>

        <p>
          Choose someone from the sidebar to
          view your messages.
        </p>
      </section>
    );
  }

  return (
    <section className="message-panel">
      <header className="chat-header">
        <div className="avatar">
          {conversation.title
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <h2>{conversation.title}</h2>

          <span>
            {conversation.participant
              ?.statusMessage ||
              "WeeChat user"}
          </span>
        </div>
      </header>

      <div className="message-list">
        {isLoading ? (
          <p className="loading-message">
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <p className="loading-message">
            No messages yet.
          </p>
        ) : (
          messages.map((message) => {
            const isOwnMessage =
              message.sender.id ===
              currentUser.id;

            return (
              <article
                key={message.id}
                className={`message-row ${
                  isOwnMessage
                    ? "own-message"
                    : ""
                }`}
              >
                <div className="message-bubble">
                  {!isOwnMessage ? (
                    <strong>
                      {
                        message.sender
                          .displayName
                      }
                    </strong>
                  ) : null}

                  <p>{message.text}</p>

                  <time>
                    {formatMessageTime(
                      message.createdAt
                    )}
                  </time>
                </div>
              </article>
            );
          })
        )}
      </div>

      <form
        className="message-composer"
        onSubmit={onSendMessage}
      >
        <input
          type="text"
          placeholder={`Message ${conversation.title}`}
          value={messageText}
          onChange={(event) =>
            onMessageChange(
              event.target.value
            )
          }
          maxLength={4000}
        />

        <button
          type="submit"
          disabled={
            !messageText.trim() ||
            isSending
          }
        >
          <Send size={19} />

          <span>
            {isSending
              ? "Sending"
              : "Send"}
          </span>
        </button>
      </form>
    </section>
  );
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const normalizedValue =
    value.includes("T")
      ? value
      : value.replace(" ", "T") + "Z";

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

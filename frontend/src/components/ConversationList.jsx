import {
  LogOut,
  MessageCircle,
} from "lucide-react";

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentUser,
  onLogout,
}) {
  return (
    <aside className="conversation-sidebar">
      <div className="sidebar-header">
        <div className="brand-row">
          <MessageCircle size={25} />

          <div>
            <h1>WeeChat</h1>
            <span>Instant messaging</span>
          </div>
        </div>
      </div>

      <div className="current-user">
        <div className="avatar">
          {currentUser.displayName
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="current-user-copy">
          <strong>
            {currentUser.displayName}
          </strong>

          <span>
            @{currentUser.username}
          </span>
        </div>

        <button
          className="icon-button"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="conversation-heading">
        Conversations
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <p className="empty-sidebar">
            No conversations yet.
          </p>
        ) : (
          conversations.map(
            (conversation) => {
              const isActive =
                conversation.id ===
                activeConversationId;

              return (
                <button
                  key={conversation.id}
                  className={`conversation-item ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    onSelectConversation(
                      conversation
                    )
                  }
                >
                  <div className="avatar">
                    {conversation.title
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="conversation-copy">
                    <div className="conversation-title-row">
                      <strong>
                        {conversation.title}
                      </strong>

                      <span>
                        {formatTime(
                          conversation
                            .lastMessage
                            ?.createdAt
                        )}
                      </span>
                    </div>

                    <p>
                      {conversation.lastMessage
                        ?.text ||
                        "Start a conversation"}
                    </p>
                  </div>
                </button>
              );
            }
          )
        )}
      </div>
    </aside>
  );
}

function formatTime(value) {
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

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

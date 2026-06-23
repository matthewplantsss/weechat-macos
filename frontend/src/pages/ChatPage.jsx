import {
  useEffect,
  useState,
} from "react";

import ConversationList from "../components/ConversationList.jsx";
import MessagePanel from "../components/MessagePanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";

import {
  getConversations,
  getMessages,
  sendMessage,
} from "../services/api.js";

export default function ChatPage() {
  const { user, logout } = useAuth();

  const [conversations, setConversations] =
    useState([]);

  const [
    activeConversation,
    setActiveConversation,
  ] = useState(null);

  const [messages, setMessages] =
    useState([]);

  const [messageText, setMessageText] =
    useState("");

  const [isLoadingMessages, setIsLoadingMessages] =
    useState(false);

  const [isSending, setIsSending] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const response =
        await getConversations();

      setConversations(response);

      if (response.length > 0) {
        setActiveConversation(
          response[0]
        );

        await loadMessages(
          response[0].id
        );
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadMessages(
    conversationId
  ) {
    setIsLoadingMessages(true);
    setError("");

    try {
      const response =
        await getMessages(
          conversationId
        );

      setMessages(response);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function selectConversation(
    conversation
  ) {
    setActiveConversation(
      conversation
    );

    await loadMessages(
      conversation.id
    );
  }

  async function handleSendMessage(
    event
  ) {
    event.preventDefault();

    const trimmedMessage =
      messageText.trim();

    if (
      !trimmedMessage ||
      !activeConversation
    ) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const response =
        await sendMessage(
          activeConversation.id,
          trimmedMessage
        );

      setMessages((currentMessages) => [
        ...currentMessages,
        response.message,
      ]);

      setMessageText("");

      const refreshedConversations =
        await getConversations();

      setConversations(
        refreshedConversations
      );

      const refreshedActive =
        refreshedConversations.find(
          (conversation) =>
            conversation.id ===
            activeConversation.id
        );

      if (refreshedActive) {
        setActiveConversation(
          refreshedActive
        );
      }
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="chat-layout">
      <ConversationList
        conversations={conversations}
        activeConversationId={
          activeConversation?.id
        }
        onSelectConversation={
          selectConversation
        }
        currentUser={user}
        onLogout={logout}
      />

      <div className="chat-content">
        {error ? (
          <div className="app-error">
            {error}
          </div>
        ) : null}

        <MessagePanel
          conversation={
            activeConversation
          }
          messages={messages}
          currentUser={user}
          messageText={messageText}
          onMessageChange={
            setMessageText
          }
          onSendMessage={
            handleSendMessage
          }
          isSending={isSending}
          isLoading={
            isLoadingMessages
          }
        />
      </div>
    </main>
  );
}

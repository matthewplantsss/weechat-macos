const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:4100/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("weechat_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export function loginUser(login, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
    }),
  });
}

export function getCurrentUser() {
  return request("/auth/me");
}

export function logoutUser() {
  return request("/auth/logout", {
    method: "POST",
  });
}

export function getConversations() {
  return request("/conversations");
}

export function getMessages(conversationId) {
  return request(
    `/messages/${conversationId}`
  );
}

export function sendMessage(
  conversationId,
  messageText
) {
  return request(
    `/messages/${conversationId}`,
    {
      method: "POST",
      body: JSON.stringify({
        messageText,
      }),
    }
  );
}

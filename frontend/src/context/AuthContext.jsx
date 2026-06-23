import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const token = localStorage.getItem(
      "weechat_token"
    );

    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        localStorage.removeItem(
          "weechat_token"
        );
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function login(loginValue, password) {
    const response = await loginUser(
      loginValue,
      password
    );

    localStorage.setItem(
      "weechat_token",
      response.token
    );

    setUser(response.user);

    return response.user;
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // Local logout should still complete.
    }

    localStorage.removeItem(
      "weechat_token"
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}

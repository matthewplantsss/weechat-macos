import { useState } from "react";
import {
  LockKeyhole,
  MessageCircle,
  User,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();

  const [loginValue, setLoginValue] =
    useState("matthew");

  const [password, setPassword] =
    useState("Password123!");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(loginValue, password);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">
          <MessageCircle size={34} />
        </div>

        <h1>WeeChat</h1>

        <p className="login-subtitle">
          Sign in to continue your conversations.
        </p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <label>
            Username or email
            <span className="input-shell">
              <User size={18} />

              <input
                type="text"
                value={loginValue}
                onChange={(event) =>
                  setLoginValue(
                    event.target.value
                  )
                }
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label>
            Password
            <span className="input-shell">
              <LockKeyhole size={18} />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                required
              />
            </span>
          </label>

          {error ? (
            <p className="form-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <div className="demo-accounts">
          <strong>Demo accounts</strong>

          <span>
            matthew / Password123!
          </span>

          <span>
            avery / Password123!
          </span>
        </div>
      </section>
    </main>
  );
}

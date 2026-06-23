import "./App.css";

import { useAuth } from "./context/AuthContext.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="loading-screen">
        <div className="loading-spinner" />
        <p>Opening WeeChat...</p>
      </main>
    );
  }

  return user ? (
    <ChatPage />
  ) : (
    <LoginPage />
  );
}

export default App;

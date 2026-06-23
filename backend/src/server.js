import "dotenv/config";
import http from "node:http";
import cors from "cors";
import express from "express";

import authRouter from "./routes/auth.js";
import conversationsRouter from "./routes/conversations.js";
import messagesRouter from "./routes/messages.js";

const app = express();
const server = http.createServer(app);

const port = Number(process.env.PORT || 4100);

const frontendOrigin =
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:5173";

app.disable("x-powered-by");

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "WeeChat Server",
    version: "1.0.0",

    endpoints: {
      health: "/api/health",
      login: "/api/auth/login",
      currentUser: "/api/auth/me",
      logout: "/api/auth/logout",
      conversations: "/api/conversations",
      messages:
        "/api/messages/:conversationId",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "weechat-server",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);

app.use(
  "/api/conversations",
  conversationsRouter
);

app.use(
  "/api/messages",
  messagesRouter
);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error("WeeChat server error:", error);

  res.status(500).json({
    message:
      "An unexpected server error occurred.",
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(
    `WeeChat server running at http://127.0.0.1:${port}`
  );
});

function shutdown(signal) {
  console.log(
    `${signal} received. Closing WeeChat server.`
  );

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

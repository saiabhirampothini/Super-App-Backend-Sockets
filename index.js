const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// Create HTTP server and integrate it with the Express app
const server = http.createServer(app);

// Integrate Socket.IO with the same server
const io = socketIo(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

app.use(express.json({ extended: false }));

// For cross-origin access
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// For cookies
app.use(cookieParser());

// Create a map to store userData
global.onlineUsers = new Map();

app.get("/", async (req, res) => {
  res.send("Socket Api Running..");
});

app.get("/api/chat/close-chat", async (req, res) => {
  try {
    const { userID } = req.body;

    if (!userID) return res.json({ msg: "userID is required " });
    onlineUsers.delete(userID);
    return res.status(200).json({ msg: "Chat closed successfully" });
  } catch (err) {
    console.error("Error closing the chat:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// For sockets
io.on("connection", (socket) => {
  console.log("connect to socket", socket.id);
  global.chatSocket = socket;

  socket.on("add-user", (userID) => {
    onlineUsers.set(userID, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUnderSocket = onlineUsers.get(data.to);
    if (sendUnderSocket) {
      socket.to(sendUnderSocket).emit("msg-recieve", data.message);
    }
  });

  socket.on("send-notification", (data) => {
    const sendUnderSocket = onlineUsers.get(data.to);
    if (sendUnderSocket) {
      socket.to(sendUnderSocket).emit("notification-recieve", data.message);
    }
  });
});

// Server port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

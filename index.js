const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

//Create Server for socket
const ioServer = http.createServer();
const io = socketIo(ioServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
});
app.use(express.json({ extended: false }));
//For cross-origin access
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
); //Enables the inclusion of cookies for CORS

//For cookies
app.use(cookieParser());
//Create a map to store userData
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

//For sockets
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

// //IO sever on another port
const IO_PORT = process.env.PORT || 5000;

ioServer.listen(IO_PORT, () => {
  console.log(`Socket.IO server is running on port ${IO_PORT}`);
});

const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = socketio(server);

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create-room", (req, res) => {
  const roomId = uuidv4();
  res.json({ roomId: roomId });
});

app.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  res.render("room", { roomId: roomId });
});

io.on("connection", (socket) => {
  console.log("CONNECTED");
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });
  socket.on("send-location", (data) => {
    const { roomId, latitude, longitude } = data;
    console.log(`Sending location to room ${roomId}:`, { latitude, longitude });
    io.to(roomId).emit("location", { id: socket.id, latitude, longitude });
  });
  socket.on("disconnect", () => {
    io.emit("user-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

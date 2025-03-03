const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, "public")));

// --- WEBSOCKET VARIABLES ---
const servers = {}; // { serverId: { name, users, messages } }
const users = {}; // { socketId: username }

io.on("connection", (socket) => {
  let clientIP = socket.handshake.address;
  console.log(`New connection from IP: ${clientIP}`);

  const hashedIP = hashIP(clientIP);
  console.log(`Hashed IP: ${hashedIP}`);
  socket.emit('ip info', hashedIP);

  console.log(`✅ User connected: ${socket.id}`);

  // Store Username
  socket.on("set username", (username) => {
    users[socket.id] = username;
    console.log(`👤 User ${socket.id} set username: ${username}`);
  });

  // Send server list
  socket.emit("server list", Object.entries(servers).map(([id, server]) => ({ id, name: server.name })));

  // --- SERVER CREATION ---
  socket.on("create server", (name) => {
    const serverId = uuidv4();
    servers[serverId] = { name, users: [], messages: [] };
    io.emit("server created", { id: serverId, name });
    console.log(`📢 Server created: ${name} (${serverId})`);
  });

  // --- JOIN SERVER ---
  socket.on("join server", (serverId) => {
    if (servers[serverId]) {
      socket.join(serverId);
      const username = users[socket.id] || `User-${socket.id.slice(0, 4)}`;
      console.log(`👤 ${username} joined ${serverId}`);
      io.to(serverId).emit("notification", `👋 ${username} joined "${servers[serverId].name}".`);
      socket.emit("server joined", { id: serverId, name: servers[serverId].name });

      // Send previous messages
      servers[serverId].messages.forEach((msg) => socket.emit("chat message", msg));
    } else {
      socket.emit("error message", "❌ Server not found.");
    }
  });

  // --- CHAT MESSAGE ---
  socket.on("chat message", ({ serverId, message }) => {
    if (servers[serverId]) {
      const sender = users[socket.id] || `User-${socket.id.slice(0, 4)}`;
      const chatMsg = { sender, message };
      servers[serverId].messages.push(chatMsg);
      io.to(serverId).emit("chat message", chatMsg);
    }
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    delete users[socket.id];
  });
});


const secretKey = crypto.randomBytes(32);  // Generate a secure 32-byte key
const iv = crypto.randomBytes(16);         // Generate a random IV

function encryptIP(ip) {
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
  let encrypted = cipher.update(ip, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

const userIP = "192.168.1.100";
const { encrypted, iv: ivHex } = encryptIP(userIP);
console.log("Encrypted IP:", encrypted);


// --- SERVER START ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

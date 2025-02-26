const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const PushNotifications = require("node-pushnotifications");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// --- WEB PUSH CONFIGURATION ---
const publicVapidKey = "your-public-vapid-key"; // 🔑 Replace with your VAPID public key
const privateVapidKey = "your-private-vapid-key"; // 🔒 Replace with your VAPID private key

const pushSettings = {
  web: {
    vapidDetails: {
      subject: "mailto:<jeffeverhart383@gmail.com>", // 📩 Replace with your email
      publicKey: publicVapidKey,
      privateKey: privateVapidKey,
    },
    gcmAPIKey: "gcmkey",
    TTL: 2419200,
    contentEncoding: "aes128gcm",
    headers: {},
  },
  isAlwaysUseFCM: false,
};

const push = new PushNotifications(pushSettings);

// --- WEBSOCKET VARIABLES ---
const servers = {}; // { serverId: { name, users, messages } }
const userActivityTimers = {}; // { socketId: timer }
const INACTIVITY_TIMEOUT = 30000; // ⏳ 30s inactivity timeout

// --- WEB PUSH ENDPOINT ---
app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  const payload = { title: "🔔 Notification from Knock" };

  push.send(subscription, payload, (err, result) => {
    if (err) console.error("❌ Push Error:", err);
    else console.log("✅ Push Sent:", result);
  });

  res.status(201).json({});
});

// --- ROUTES ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/main.js", (req, res) => res.sendFile(path.join(__dirname, "public", "main.js")));
app.get("/sw.js", (req, res) => res.sendFile(path.join(__dirname, "public", "sw.js")));

function sendPushNotification(title, message) {
  const payload = { title, message };
  // Implement sending to stored subscriptions if available
  console.log(`📩 Sending push: ${title} - ${message}`);
}

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Send server list
  socket.emit("server list", Object.entries(servers).map(([id, server]) => ({ id, name: server.name })));

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (userActivityTimers[socket.id]) clearTimeout(userActivityTimers[socket.id]);
    userActivityTimers[socket.id] = setTimeout(() => {
      socket.emit("notification", "⚠️ You've been inactive for a while. Stay active!");
      sendPushNotification("⚠️ User inactive alert!", `User ${socket.id} is inactive.`);
    }, INACTIVITY_TIMEOUT);
  };

  resetInactivityTimer();

  // --- SERVER CREATION ---
  socket.on("create server", (name) => {
    resetInactivityTimer();
    const serverId = uuidv4();
    servers[serverId] = { name, users: [], messages: [] };
    io.emit("server created", { id: serverId, name });
    io.emit("notification", `🟢 Server "${name}" created!`);
    console.log(`📢 Server created: ${name} (${serverId})`);
    sendPushNotification("🟢 New Server Created!", `Server "${name}" is now available.`);
  });

  // --- JOIN SERVER ---
  socket.on("join server", (serverId) => {
    resetInactivityTimer();
    if (servers[serverId]) {
      socket.join(serverId);
      console.log(`👤 ${socket.id} joined ${serverId}`);
      const joinMsg = `👋 User-${socket.id.slice(0, 4)} joined "${servers[serverId].name}".`;
      io.to(serverId).emit("notification", joinMsg);
      socket.emit("server joined", { id: serverId, name: servers[serverId].name });
      servers[serverId].messages.forEach((msg) => socket.emit("chat message", msg));
    } else {
      socket.emit("error message", "❌ Server not found.");
    }
  });

  // --- CHAT MESSAGE ---
  socket.on("chat message", ({ serverId, message }) => {
    resetInactivityTimer();
    if (servers[serverId]) {
      const sender = `User-${socket.id.slice(0, 4)}`;
      const chatMsg = { sender, message };
      servers[serverId].messages.push(chatMsg);
      io.to(serverId).emit("chat message", chatMsg);
    }
  });

  // --- USER ACTIVITY TRACKING ---
  socket.on("user active", resetInactivityTimer);

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    clearTimeout(userActivityTimers[socket.id]);
    delete userActivityTimers[socket.id];
  });
});

// --- PUSH NOTIFICATION FUNCTION ---
function sendPushNotification(title, message) {
  const payload = { title, message };
  // Implement sending to stored subscriptions if available
  console.log(`📩 Sending push: ${title} - ${message}`);
}

// --- SERVER START ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

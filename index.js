const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const servers = {}; // { serverId: { name: 'Server Name', users: [], messages: [] } }
const userActivityTimers = {}; // Track user activity per socket

// Inactivity timeout (milliseconds)
const INACTIVITY_TIMEOUT = 30000;

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Send available servers to the client
  socket.emit('server list', Object.entries(servers).map(([id, server]) => ({ id, name: server.name })));

  // Function to reset inactivity timer
  const resetInactivityTimer = () => {
    if (userActivityTimers[socket.id]) clearTimeout(userActivityTimers[socket.id]);
    userActivityTimers[socket.id] = setTimeout(() => {
      socket.emit('notification', '⚠️ You have been inactive for a while. Stay active!');
    }, INACTIVITY_TIMEOUT);
  };

  resetInactivityTimer(); // Start the timer on connection

  // Handle server creation with notification
  socket.on('create server', (name) => {
    resetInactivityTimer();
    const serverId = uuidv4();
    servers[serverId] = { name, users: [], messages: [] };
    io.emit('server created', { id: serverId, name });
    io.emit('notification', `🟢 Server "${name}" has been created!`);
    console.log(`📢 Server created: ${name} (${serverId})`);
  });

  // Handle joining a server with notification
  socket.on('join server', (serverId) => {
    resetInactivityTimer();
    if (servers[serverId]) {
      socket.join(serverId);
      console.log(`👤 User ${socket.id} joined server ${serverId}`);
      const joinMessage = `👋 User-${socket.id.slice(0, 4)} joined the server "${servers[serverId].name}".`;
      io.to(serverId).emit('notification', joinMessage);
      socket.emit('server joined', { id: serverId, name: servers[serverId].name });

      // Send previous messages
      servers[serverId].messages.forEach((msg) => {
        socket.emit('chat message', msg);
      });
    } else {
      socket.emit('error message', '❌ Server not found.');
    }
  });

  // Handle chat messages with activity tracking
  socket.on('chat message', ({ serverId, message }) => {
    resetInactivityTimer();
    if (servers[serverId]) {
      const sender = `User-${socket.id.slice(0, 4)}`;
      const chatMsg = { sender, message };
      servers[serverId].messages.push(chatMsg);
      io.to(serverId).emit('chat message', chatMsg);
    }
  });

  // Track user activity (mouse/keyboard)
  socket.on('user active', () => {
    resetInactivityTimer();
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    clearTimeout(userActivityTimers[socket.id]);
    delete userActivityTimers[socket.id];
  });
});

server.listen(8080, () => {
  console.log('🚀 Server running on http://localhost:8080');
});

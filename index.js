// index.js (Node.js server with server creation and chat functionality)

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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle server creation
  socket.on('create server', (name) => {
    const serverId = uuidv4();
    servers[serverId] = { name, users: [], messages: [] };
    io.emit('server created', { id: serverId, name });
    console.log(`Server created: ${name} (${serverId})`);
  });

  // Handle joining a server
  socket.on('join server', (serverId) => {
    if (servers[serverId]) {
      socket.join(serverId);
      console.log(`User ${socket.id} joined server ${serverId}`);
      servers[serverId].messages.forEach((msg) => {
        socket.emit('chat message', msg);
      });
    }
  });

  // Handle chat messages
  socket.on('chat message', ({ serverId, message }) => {
    if (servers[serverId]) {
      const chatMsg = { sender: `User-${socket.id.slice(0, 4)}`, message };
      servers[serverId].messages.push(chatMsg);
      io.to(serverId).emit('chat message', chatMsg);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});

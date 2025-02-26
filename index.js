const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let serverConfig = { roomName: 'Default Room', port: 8080 };

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle chat messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Handle server config updates
  socket.on('server config', (config) => {
    serverConfig = { ...serverConfig, ...config };
    console.log('Updated Config:', serverConfig);
    io.emit('config updated', serverConfig);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(serverConfig.port, () => {
  console.log(`Server running on http://localhost:${serverConfig.port}`);
});

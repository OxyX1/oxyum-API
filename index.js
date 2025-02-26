const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle socket connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});

// script.js - Handles server creation, joining, and real-time chat functionality

const socket = io();
let currentServerId = null;

const serverList = document.getElementById('server-list');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');

// Load server list
socket.on('server list', (servers) => {
  serverList.innerHTML = '';
  servers.forEach(({ id, name }) => addServerToList(id, name));
});

// Add a new server to the list when created
socket.on('server created', ({ id, name }) => {
  addServerToList(id, name);
});

// Join server confirmation
socket.on('server joined', ({ id, name }) => {
  currentServerId = id;
  chatMessages.innerHTML = `<h3>Connected to: ${name}</h3>`;
});

// Display incoming chat messages
socket.on('chat message', ({ sender, message }) => {
  const msgElement = document.createElement('div');
  msgElement.textContent = `${sender}: ${message}`;
  chatMessages.appendChild(msgElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Handle errors
socket.on('error message', (error) => {
  alert(error);
});

// Create server handler
document.getElementById('create-server').addEventListener('click', () => {
  const serverName = document.getElementById('server-name').value.trim();
  if (serverName) {
    socket.emit('create server', serverName);
    document.getElementById('server-name').value = '';
  }
});

// Join server handler
document.getElementById('join-server').addEventListener('click', () => {
  const serverId = document.getElementById('join-server-id').value.trim();
  if (serverId) {
    socket.emit('join server', serverId);
    document.getElementById('join-server-id').value = '';
  }
});

// Send message handler
document.getElementById('send-message').addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message && currentServerId) {
    socket.emit('chat message', { serverId: currentServerId, message });
    messageInput.value = '';
  }
}

function addServerToList(id, name) {
  const serverItem = document.createElement('div');
  serverItem.className = 'server-item';
  serverItem.textContent = `${name} (ID: ${id})`;
  serverItem.addEventListener('click', () => {
    socket.emit('join server', id);
  });
  serverList.appendChild(serverItem);
}

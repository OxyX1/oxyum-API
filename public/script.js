// script.js - Handles server creation, joining, real-time chat, and notifications

const socket = io();
let currentServerId = null;

const serverList = document.getElementById('server-list');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const notificationBox = document.getElementById('notifications');

// Load server list
socket.on('server list', (servers) => {
  serverList.innerHTML = '';
  servers.forEach(({ id, name }) => addServerToList(id, name));
});

// Add a new server to the list when created
socket.on('server created', ({ id, name }) => {
  addServerToList(id, name);
  showNotification(`🟢 New server "${name}" created!`);
});

// Join server confirmation
socket.on('server joined', ({ id, name }) => {
  currentServerId = id;
  chatMessages.innerHTML = `<h3>Connected to: ${name}</h3>`;
  showNotification(`✅ You joined the server "${name}"`);
});

// Display incoming chat messages
socket.on('chat message', ({ sender, message }) => {
  const msgElement = document.createElement('div');
  msgElement.textContent = `${sender}: ${message}`;
  chatMessages.appendChild(msgElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Handle notifications from the server
socket.on('notification', (message) => {
  showNotification(message);
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

// Add server to server list UI
function addServerToList(id, name) {
  const serverItem = document.createElement('div');
  serverItem.className = 'server-item';
  serverItem.textContent = `${name} (ID: ${id})`;
  serverItem.addEventListener('click', () => {
    socket.emit('join server', id);
  });
  serverList.appendChild(serverItem);
}

// Show notification with fade-out effect
function showNotification(message) {
  const div = document.createElement('div');
  div.className = 'notification';
  div.textContent = message;
  notificationBox.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 1000);
  }, 5000);
}

// Track user activity and notify server to reset inactivity timer
['mousemove', 'keydown', 'click'].forEach((event) => {
  window.addEventListener(event, () => {
    socket.emit('user active');
  });
});

const socket = io();
let currentServerId = null;
let username = localStorage.getItem('username') || '';

// DOM Elements
const serverList = document.getElementById('server-list');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const notificationBox = document.getElementById('notifications');

// Popup Elements
const usernamePopup = document.getElementById('username-popup');
const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username');

const serverPopup = document.getElementById('server-popup');
const openServerPopupBtn = document.getElementById('open-server-popup');
const closeServerPopupBtn = document.getElementById('close-server-popup');

// Handle Username Popup
if (!username) {
  usernamePopup.classList.add('show');
} else {
  socket.emit('set username', username);
}

// Save Username from Popup
saveUsernameBtn.addEventListener('click', () => {
  const newUsername = usernameInput.value.trim();
  if (newUsername) {
    username = newUsername;
    localStorage.setItem('username', username);
    socket.emit('set username', username);
    usernamePopup.classList.remove('show');
  } else {
    alert('Username cannot be empty!');
  }
});

// Open & Close Server Popup
openServerPopupBtn.addEventListener('click', () => {
  serverPopup.classList.add('show');
});

closeServerPopupBtn.addEventListener('click', () => {
  serverPopup.classList.remove('show');
});

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

// Create server handler (from popup)
document.getElementById('create-server').addEventListener('click', () => {
  const serverName = document.getElementById('server-name').value.trim();
  if (serverName) {
    socket.emit('create server', serverName);
    document.getElementById('server-name').value = '';
    serverPopup.classList.remove('show');
  }
});

// Join server handler (from popup)
document.getElementById('join-server').addEventListener('click', () => {
  const serverId = document.getElementById('join-server-id').value.trim();
  if (serverId) {
    socket.emit('join server', serverId);
    document.getElementById('join-server-id').value = '';
    serverPopup.classList.remove('show');
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
    socket.emit('chat message', { serverId: currentServerId, sender: username, message });
    messageInput.value = '';
  }
}

// Add server to server list UI
function addServerToList(id, name) {
  const serverItem = document.createElement('div');
  serverItem.className = 'server-item';
  serverItem.textContent = `${name}`;
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

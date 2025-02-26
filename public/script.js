const socket = io();
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatBox = document.getElementById('chat-box');

// Config modal elements
const configBtn = document.getElementById('config-btn');
const configModal = document.getElementById('config-modal');
const overlay = document.getElementById('overlay');
const saveConfigBtn = document.getElementById('save-config-btn');
const closeConfigBtn = document.getElementById('close-config-btn');
const roomNameInput = document.getElementById('room-name-input');
const portInput = document.getElementById('port-input');

// Chat functionality
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat message', message);
    messageInput.value = '';
  }
}

function appendMessage(message) {
  const msgElement = document.createElement('div');
  msgElement.textContent = message;
  chatBox.appendChild(msgElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Listen for incoming messages
socket.on('chat message', (message) => {
  appendMessage(`User: ${message}`);
});

// Modal functionality
configBtn.addEventListener('click', () => toggleModal(true));
closeConfigBtn.addEventListener('click', () => toggleModal(false));
overlay.addEventListener('click', () => toggleModal(false));

function toggleModal(show) {
  configModal.classList.toggle('active', show);
  overlay.classList.toggle('active', show);
}

// Save config changes
saveConfigBtn.addEventListener('click', () => {
  const roomName = roomNameInput.value.trim() || 'Default Room';
  const port = parseInt(portInput.value.trim(), 10) || 8080;

  socket.emit('server config', { roomName, port });
  appendMessage(`⚙️ Config Updated: Room - ${roomName}, Port - ${port}`);
  toggleModal(false);
});

// Receive updated config
socket.on('config updated', (config) => {
  appendMessage(`🔧 Server Config Changed: Room - ${config.roomName}, Port - ${config.port}`);
});

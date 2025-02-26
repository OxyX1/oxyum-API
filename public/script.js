const socket = io();
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatBox = document.getElementById('chat-box');

// Send message on button click or Enter key
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat message', message);
    appendMessage(`You: ${message}`);
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

const socket = io();
let currentServerId = null;
let username = localStorage.getItem("username") || "";

// DOM Elements
const serverList = document.getElementById("server-list");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const notificationBox = document.getElementById("notifications");

// Popup Elements
const usernamePopup = document.getElementById("username-popup");
const usernameInput = document.getElementById("username-input");
const saveUsernameBtn = document.getElementById("save-username");

const serverPopup = document.getElementById("server-popup");
const openServerPopupBtn = document.getElementById("open-server-popup");
const closeServerPopupBtn = document.getElementById("close-server-popup");

// Settings Popup Elements
const settingsPopup = document.getElementById("settings-popup");
const openSettingsPopupBtn = document.getElementById("open-settings-popup");
const closeSettingsPopupBtn = document.getElementById("close-settings-popup");
const newUsernameInput = document.getElementById("new-username");
const updateUsernameBtn = document.getElementById("update-username");

// Handle Username Popup
if (!username) {
  usernamePopup.classList.add("show");
} else {
  socket.emit("set username", username);
}

// Save Username from Popup
saveUsernameBtn.addEventListener("click", () => {
  const newUsername = usernameInput.value.trim();
  if (newUsername) {
    username = newUsername;
    localStorage.setItem("username", username);
    socket.emit("set username", username);
    usernamePopup.classList.remove("show");
  } else {
    alert("Username cannot be empty!");
  }
});

// Open & Close Server Popup
openServerPopupBtn.addEventListener("click", () => {
  serverPopup.classList.add("show");
});

closeServerPopupBtn.addEventListener("click", () => {
  serverPopup.classList.remove("show");
});

// Open & Close Settings Popup
openSettingsPopupBtn.addEventListener("click", () => {
  settingsPopup.classList.add("show");
});

closeSettingsPopupBtn.addEventListener("click", () => {
  settingsPopup.classList.remove("show");
});

// Update Username in Settings
updateUsernameBtn.addEventListener("click", () => {
  const newUsername = newUsernameInput.value.trim();
  if (newUsername) {
    username = newUsername;
    localStorage.setItem("username", username);
    socket.emit("update username", username);
    settingsPopup.classList.remove("show");
    showNotification(`✅ Username changed to "${username}"`);
  } else {
    alert("Username cannot be empty!");
  }
});

// Load server list
socket.on("server list", (servers) => {
  serverList.innerHTML = "";
  servers.forEach(({ id, name }) => addServerToList(id, name));
});

// Add a new server to the list when created
socket.on("server created", ({ id, name }) => {
  addServerToList(id, name);
  showNotification(`🟢 New server "${name}" created!`);
});

// Join server confirmation
socket.on("server joined", ({ id, name }) => {
  currentServerId = id;
  chatMessages.innerHTML = `<h3>Connected to: ${name}</h3>`;
  showNotification(`✅ You joined the server "${name}"`);
});

// Display incoming chat messages with sound
socket.on("chat message", ({ sender, message }) => {
  const msgElement = document.createElement("div");
  msgElement.textContent = `${sender}: ${message}`;
  chatMessages.appendChild(msgElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  playNotificationSound(); // Play sound
});

// Play a notification sound
function playNotificationSound() {
  const audio = new Audio("./sound/notification.mp3"); // Ensure this file exists in your public folder
  audio.play().catch((e) => console.error("Sound play failed:", e));
}

// Add server to server list UI
function addServerToList(id, name) {
  const serverItem = document.createElement("div");
  serverItem.className = "server-item";
  serverItem.textContent = `${name}`;
  serverItem.addEventListener("click", () => {
    socket.emit("join server", id);
  });
  serverList.appendChild(serverItem);
}

// Show notification
function showNotification(message) {
  const div = document.createElement("div");
  div.className = "notification";
  div.textContent = message;
  notificationBox.appendChild(div);

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 1000);
  }, 5000);
}

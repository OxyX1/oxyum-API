/*

This is the oxyum networks official api.

tools:

cloud browser
cloud desktop
chat system

future ideas:

universal frontend server --> its a server were the user can make whatever they want out of it.

*/


const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

app.get('/cloudbrowser', (req, res) => {
    res.json({ message: 'Cloud browser endpoint reached successfully!' });
});

http.createServer(app).listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
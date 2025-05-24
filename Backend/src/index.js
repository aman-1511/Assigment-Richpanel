const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

// Import handlers
const createUser = require('./Handlers/AuthHandlers/createUser');
const login = require('./Handlers/AuthHandlers/login');
const getUser = require('./Handlers/AuthHandlers/getUser');
const receiveMessageWebhookCheck = require('./Handlers/FacebookApiHandlers/receiveMessageWebhookCheck');
const receiveMessageWebhook = require('./Handlers/FacebookApiHandlers/receivemessageWebhook');
const getMessages = require('./Handlers/MessageHandlers/getMessages');
const sendMessage = require('./Handlers/MessageHandlers/sendMessage');
const websocketHandler = require('./Handlers/WebsocketHandler/websocketHandler');


const db = require('./Database/db');


require('./Models/User');
require('./Models/Connections');
require('./Models/Message');


const validateUser = require('./Controllers/ValidateUser');


dotenv.config();

const app = express();
const server = http.createServer(app);


const wss = new WebSocket.Server({ server });


app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/facebook-helpdesk')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


wss.on('connection', websocketHandler.handler);


app.post('/auth/signup', createUser.handler);
app.post('/auth/login', login.handler);
app.get('/auth/get-user', validateUser, getUser.handler);


app.get('/webhook', receiveMessageWebhookCheck.handler);
app.post('/webhook', receiveMessageWebhook.handler);


app.get('/messages', validateUser, getMessages.handler);
app.get('/messages/getAllMessages', validateUser, getMessages.handler);
app.post('/messages/send', validateUser, sendMessage.handler);


app.get('/', (req, res) => {
  res.json({ message: 'Facebook Helpdesk API is running' });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
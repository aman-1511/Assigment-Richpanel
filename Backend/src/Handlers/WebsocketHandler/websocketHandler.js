const { sendError, sendResponse } = require("../../Utils/response");
const connectToDatabase = require("../../Database/db");
const Connections = require("../../Models/Connections");


const activeConnections = new Map();


module.exports.getConnection = (connectionId) => {
  return activeConnections.get(connectionId);
};

const sendConfirmation = async (ws, payload) => {
  try {
    if (ws && ws.readyState === 1) { 
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending confirmation:", error);
    return false;
  }
};

const joinChat = async (pageId, connectionId, ws) => {
  console.log("JOINING", connectionId);

  try {
    const db = await connectToDatabase();

   
    await Connections.deleteMany({ pageId: pageId });

    
    const newConnection = new Connections({
      pageId: pageId,
      connectionId: connectionId,
    });
    console.log(newConnection);
    const savedConnection = await newConnection.save();
    console.log("New connection saved");
    const payload = {
      action: "socket-init-confirmation",
      status: 200,
      message: "Socket initialised",
    };
    await sendConfirmation(ws, payload);
  } catch (err) {
    const payload = {
      action: "socket-init-confirmation",
      status: 400,
      message:
        "Could not initialise socket channel ... please refresh the page",
    };
    await sendConfirmation(ws, payload);
    console.error("Error joining chat:", err);
  }
};

module.exports.handler = function(ws, req) {
  
  const connectionId = Date.now().toString();
  console.log(`New connection: ${connectionId}`);
   // Store the connection
  activeConnections.set(connectionId, ws);
  
  ws.on('message', async (message) => {
    try {
      const payload = JSON.parse(message.toString());
      
      if (payload) {
        switch (payload.action) {
          case "join-chat":
            await joinChat(payload?.pageId, connectionId, ws);
            break;
          default:
            console.log(`Unknown action: ${payload.action}`);
            break;
        }
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  });
  
  ws.on('close', () => {
    console.log(`Connection closed: ${connectionId}`);
    activeConnections.delete(connectionId);
  });
};

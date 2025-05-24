const connectToDatabase = require("../../Database/db");
const Connections = require("../../Models/Connections");
const Message = require("../../Models/Message");
const userModel = require("../../Models/User");
const { sendError, sendResponse } = require("../../Utils/response");
const { getConnection } = require("../WebsocketHandler/websocketHandler");

const sendToConnection = async (senderId, pageId, message) => {
  try {
    const db = await connectToDatabase();

    const data = await Connections.aggregate([
      { $match: { pageId: pageId } },
      { $sort: { created_at: -1 } },
      { $limit: 1 },
    ]);
    
    const payload = {
      action: "message",
      senderId,
      pageId,
      message,
      created_at: new Date(),
    };
    
    if (!data || data.length === 0) {
      console.log("No connection found for pageId:", pageId);
      return { success: false, error: "No connection found" };
    }
    
    const connection = data[0];
    const connectionId = connection?.connectionId;
    console.log("Found connection:", connectionId);

    const wsConnection = getConnection(connectionId);
    if (wsConnection && wsConnection.readyState === 1) { // 1 = OPEN
      wsConnection.send(JSON.stringify(payload));
      return { success: true };
    } else {
      console.log("WebSocket connection not found or not open");
      return { success: false, error: "Connection not available" };
    }
  } catch (err) {
    console.log("ERROR in sendToConnection:", err);
    return { success: false, error: err };
  }
};

module.exports.handler = async (req, res) => {
  console.log("WEBHOOK CALLED");

  try {
    const db = await connectToDatabase();
    const body = req.body;
    
    if (body?.entry && body.entry.length > 0) {
      const entry = body.entry[0];
      
      if (entry?.messaging && entry.messaging.length > 0) {
        const messaging = entry.messaging[0];
        const senderId = messaging?.sender?.id;
        const pageId = messaging?.recipient?.id;
        const message = messaging?.message?.text;
        
        console.log(`Received message from ${senderId} to page ${pageId}: ${message}`);
        
        if (!senderId || !pageId || !message) {
          console.log("Missing required fields in webhook payload:", { senderId, pageId, message });
          return res.status(200).json({ message: "Ignored incomplete message" });
        }

      const newMessage = new Message({
        clientId: senderId,
        senderId: senderId,
        pageId: pageId,
        message: message,
          created_at: new Date()
      });

      const savedMessage = await newMessage.save();
        console.log("Message saved to database:", savedMessage._id);

        try {
          await sendToConnection(senderId, pageId, message);
          console.log("Message sent to WebSocket connection");
        } catch (err) {
          console.error("Failed to send message to WebSocket:", err);
        }
      } else {
        console.log("No messaging array in webhook entry");
      }
    } else {
      console.log("No entries in webhook payload");
    }
    
   
    return res.status(200).json({
      message: "success!",
    });
  } catch (error) {
    console.error("Error in webhook handler:", error);
   
    return res.status(200).json({
      message: "Received but encountered an error",
      error: error.message
    });
  }
};

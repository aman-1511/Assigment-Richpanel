const connectToDatabase = require("../../Database/db");
const Message = require("../../Models/Message");
const Connections = require("../../Models/Connections");
const axios = require("axios");
const { sendError, sendResponse } = require("../../Utils/response");
const { getConnection } = require("../WebsocketHandler/websocketHandler");

const notifyWebSocketClient = async (senderId, pageId, message) => {
  try {
    const db = await connectToDatabase();

    const data = await Connections.aggregate([
      { $match: { pageId: pageId } },
      { $sort: { created_at: -1 } },
      { $limit: 1 },
    ]);
    
    if (!data || data.length === 0) {
      console.log("No connection found for pageId:", pageId);
      return { success: false, error: "No connection found" };
    }
    
    const connection = data[0];
    const connectionId = connection?.connectionId;
    console.log("Found connection for notification:", connectionId);

    const payload = {
      action: "message",
      senderId,
      pageId,
      message,
      created_at: new Date(),
    };

    const wsConnection = getConnection(connectionId);
    if (wsConnection && wsConnection.readyState === 1) { // 1 = OPEN
      wsConnection.send(JSON.stringify(payload));
      console.log("WebSocket notification sent for outgoing message");
      return { success: true };
    } else {
      console.log("WebSocket connection not found or not open for notification");
      return { success: false, error: "Connection not available" };
    }
  } catch (err) {
    console.log("ERROR in notifyWebSocketClient:", err);
    return { success: false, error: err };
  }
};

module.exports.handler = async (req, res) => {
  const { pageId, clientId, message, accessToken } = req.body;
  const dataToSend = {
    recipient: { id: clientId },
    messaging_type: "RESPONSE",
    message: { text: message.trim() },
  };

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/messages`,
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    const errorCode = error?.response?.data?.error?.code;
    if (errorCode === 190) {
      return res.status(400).json({
        message:
          "Page access token has expired ... please reconnect to facebook page",
      });
    }
    return res.status(400).json({ message: error.message });
  }

  try {
    const newMessage = new Message({
      pageId: pageId,
      senderId: pageId,
      clientId: clientId,
      message: message,
    });
    const savedMessage = await newMessage.save();
    
    // Notify WebSocket client about the sent message
    try {
      await notifyWebSocketClient(pageId, pageId, message);
    } catch (wsError) {
      console.error("Error notifying WebSocket:", wsError);
      // Continue even if WebSocket notification fails
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(200).json({
    message: "Message sent successfully",
  });
};

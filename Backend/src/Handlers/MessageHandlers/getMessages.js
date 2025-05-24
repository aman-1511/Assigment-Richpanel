const connectToDatabase = require("../../Database/db");
const Message = require("../../Models/Message");

const { sendError, sendResponse } = require("../../Utils/response");

module.exports.handler = async (req, res) => {
  try {
    console.log("GET /messages - Request received with query params:", req.query);
    const pageId = req.query.pageId;
    if (!pageId || pageId === "") {
      console.log("Invalid pageId provided:", pageId);
      return res.status(400).json({ message: "Please provide a valid page id" });
    }

    console.log("Fetching messages for pageId:", pageId);
   
    const allMessages = await Message.find({ pageId: pageId }).sort({ created_at: 1 });
    console.log(`Found ${allMessages.length} messages for pageId ${pageId}`);

   
    const messagesGroupedBySenders = allMessages.reduce((acc, item) => {
      if (!acc[item.clientId]) {
        acc[item.clientId] = {
          clientId: item.clientId,
          pageId: item.pageId,
          messages: [],
        };
      }
      

      acc[item.clientId].messages.push({
        message: item.message || "",
        senderId: item.senderId,
        time: item.created_at || new Date(),
      });
      
      return acc;
    }, {});
    
    const payload = Object.values(messagesGroupedBySenders);
    
    return res.status(200).json({
      messages: payload,
      message: "Messages retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve messages", 
      error: error.message 
    });
  }
};

const connectToDatabase = require("../../Database/db");
const userModel = require("../../Models/User");
const { sendError, sendResponse } = require("../../Utils/response");

module.exports.handler = async (req, res) => {
  try {
    const queryParams = req.query;
    if (queryParams) {
      const verifyToken = process.env.FB_WEBHOOK_VERIFICATION_TOKEN || 'default_verify_token';
      let token = queryParams["hub.verify_token"];
      let challenge = queryParams["hub.challenge"];

      console.log("Verify token:", token);
      console.log("Challenge:", challenge);
      
      if (token && token === verifyToken) {
       
        console.log("WEBHOOK_VERIFIED");
        return res.status(200).send(challenge);
      }
    }

    return res.status(403).json({ message: "Verification failed" });
  } catch (error) {
    console.error("Webhook verification error:", error);
    return res.status(500).json({ message: "An error occurred during webhook verification" });
  }
};

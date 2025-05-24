const jwt_decode = require("jwt-decode");
const { sendError, sendResponse } = require("../../Utils/response");

module.exports.handler = async (req, res) => {
  try {
    const token = req.headers.authorization.split("Bearer ")[1];
    const decoded = jwt_decode(token);
    if (decoded?.data) {
      return res.status(200).json({ user: decoded?.data, message: "success" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ message: "An error occurred while retrieving user data" });
  }
};

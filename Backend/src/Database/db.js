const mongoose = require("mongoose");
let cachedDbConn = null;

module.exports = connectToDatabase = async () => {
  if (cachedDbConn === null) {
    console.log("Creating new mongodb connection");
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/facebook-helpdesk';
    
    try {
    cachedDbConn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
      console.log("MongoDB connection successful");
    return cachedDbConn;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  console.log("Connection already established ... reusing the connection");
  return cachedDbConn;
};

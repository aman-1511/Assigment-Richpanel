const connectToDatabase = require("../../Database/db");
const { loginValidation } = require("../../Validation/SchemaValidation");
const jwt = require("jsonwebtoken");
const userModel = require("../../Models/User");
const bcrypt = require("bcryptjs");
const { sendError, sendResponse } = require("../../Utils/response");

async function generateToken(data) {
  const token = await jwt.sign(
    {
      data,
    },
    process.env.JWT_SECRET
  );
  return token;
}

module.exports.handler = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const reqObj = req.body;

   
    const { error } = loginValidation.validate(reqObj);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

   
    const user = await userModel.findOne({
      email: reqObj.email,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Login Credentials" });
    }
   
    const validPass = await bcrypt.compare(reqObj.password, user.password);
    if (!validPass) {
      return res.status(400).json({ message: "Invalid Login Credentials" });
    }

   
    const userObj = { _id: user._id, name: user.name, email: user.email };
    const _token = await generateToken(userObj);
    return res.status(200).json({
      user: userObj,
      message: "Login success!",
      token: _token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "An error occurred during login" });
  }
};

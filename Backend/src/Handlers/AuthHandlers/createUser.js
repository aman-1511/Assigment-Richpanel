const connectToDatabase = require("../../Database/db");
const { registerValidation } = require("../../Validation/SchemaValidation");
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
  const { error } = registerValidation.validate(reqObj);
  if (error) {
      return res.status(400).json({ message: error.details[0].message });
  }
    
 
    const userFound = await userModel.findOne({
      email: reqObj.email,
    });
    if (userFound) {
      return res.status(400).json({ message: "User already exists" });
    }

   
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(reqObj.password, salt);

   
    const trimmedName = reqObj.name.trim();
    const trimmedEmail = reqObj.email.trim();
    const user = new userModel({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPass,
    });

    const savedUser = await user.save();
    
   
    const newUser = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email
    };
    
   
    const _token = await generateToken(newUser);
    
    return res.status(201).json({
      user: newUser,
      message: "Signup success!",
      token: _token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "An error occurred during signup" });
  }
};

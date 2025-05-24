const jwt_decode = require("jwt-decode");

const validateUser = (req, res, next) => {
  try {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    const token = req.headers.authorization.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' });
    }
    
    const userDetails = jwt_decode(token);
    if (!userDetails || !userDetails.data || !userDetails.data._id) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
    
   
    req.userId = userDetails.data._id;
    
  
    next();
  } catch (err) {
    console.error('Token validation error:', err);
    return res.status(401).json({ message: 'Unauthorized - Token validation failed' });
  }
};

module.exports = validateUser;

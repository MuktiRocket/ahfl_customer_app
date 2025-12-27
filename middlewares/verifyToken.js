const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authToken =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!authToken) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: "Unauthorized: No token provided",
    });
  }

  jwt.verify(authToken, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Invalid access token!",
        data: {},
      });
    }
    req.data = decoded;
    //console.log({ data: req.data })
    next();
  });
};

module.exports = { verifyToken };

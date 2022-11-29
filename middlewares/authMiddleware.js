const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/helper");
// const User = require("../models/authModel");

module.exports.authMiddleware = async (req, res, next) => {
  // const { authToken } = req.cookies;
  const token = req.headers?.authorization;

  if (!token) return sendError(res, "Invalid token!");
  const authToken = token.split("Bearer ")[1];

  if (!authToken) return sendError(res, "Invalid JWTToken!");
  const deCodeToken = jwt.verify(authToken, process.env.SECRET);
  // const { userId } = deCodeToken;
  req.myId = deCodeToken.id;

  // const user = await User.findById(userId);
  // if (!user) return sendError(res, "unauthorized access!(No User Token Found)");
  // // req.myId = deCodeToken.id;
  // req.user = user;
  // console.log(user);
  next();
};

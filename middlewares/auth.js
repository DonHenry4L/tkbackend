require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Post = require("../models/post");
const { sendError } = require("../utils/helper");
// const admin = require("../firebase");

exports.isAuth = async (req, res, next) => {
  const bearerToken = req.headers?.authorization;
  if (!bearerToken)
    return sendError(res, "unauthorized access. Check your Token!");

  const token = bearerToken.split(" ")[1];
  if (!token) return sendError(res, "unauthorized access!. invalid token!");

  const decode = jwt.verify(token, process.env.JWT_SECRET);
  if (!decode.userId) {
    return sendError(res, "unauthorized access!. unable to decode userId");
  }

  const user = await User.findById(decode.userId);
  if (!user) {
    return sendError(res, "unauthorized access!. userId not found");
  }

  req.user = user;

  next();
};
//   try {
//     const token = req.cookies.access_token;
//     if (!token) {
//       return res.status(403).send("A token is required for authentication");
//     }
//     try {
//       const decode = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = decode;
//       next();
//     } catch (error) {
//       return res.status(401).send("Unauthorized. Invalid Token");
//     }
//   } catch (error) {
//     next(error);
//   }
// };

exports.isAdmin = async (req, res, next) => {
  const { user } = req;
  if (user.role === "Admin") next();
  else return sendError(res, "unauthorized access!(Not An Admin)");
};

exports.isAuthor = async (req, res, next) => {
  const { user } = req;
  if (user.role === "Author") next();
  else return sendError(res, "unauthorized access! (Not An Author)");
};
exports.isASubscriber = async (req, res, next) => {
  const { user } = req;
  if (user.role === "Subscriber") next();
  else return sendError(res, "unauthorized access! (Not A Subscriber)");
};

exports.canCreateRead = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    switch (user.role) {
      case "Admin":
        next();
        break;
      case "Subscriber":
        next();
        break;
      default:
        return res.status(403).send("Unauthorized");
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canUpdateDeletePost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const post = await Post.findById(req.params.postId);
    switch (user.role) {
      case "Admin":
        next();
        break;
      case "Subscriber":
        if (post.postedBy.toString() !== user._id.toString()) {
          return res.status(403).send("Unauthorized");
        } else {
          next();
        }
        break;
      default:
        return res.status(403).send("Unauthorized");
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canDeleteMedia = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const media = await Media.findById(req.params.id);
    switch (user.role) {
      case "Admin":
        next();
        break;
      case "Subscriber":
        if (media.postedBy.toString() !== req.user._id.toString()) {
          return res.status(403).send("Unauthorized");
        } else {
          next();
        }
        break;
    }
  } catch (err) {
    console.log(err);
  }
};

exports.canUpdateDeleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    const user = await User.findById(req.user._id);

    switch (user.role) {
      case "Admin":
        next();
        break;
      case "Author":
        if (comment.postedBy.toString() === req.user._id.toString()) {
          next();
        }
        break;
      case "Subscriber":
        if (comment.postedBy.toString() === req.user._id.toString()) {
          next();
        }
        break;
      default:
        return res.status(403).send("Unauthorized user");
    }
  } catch (err) {
    console.log(err);
  }
};

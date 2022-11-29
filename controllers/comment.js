const expressAsyncHandler = require("express-async-handler");
const { isValidObjectId } = require("mongoose");
const Comment = require("../models/comment");
const Post = require("../models/post");
const { sendError } = require("../utils/helper");

// create Comments
exports.createComment = expressAsyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;
  // console.log(JSON.stringify(req.body));

  //   verify user before comment
  if (!req.user.isVerified)
    return sendError(res, "Please verify your email first!");
  if (!isValidObjectId(postId)) return sendError(res, "Invalid PostId!");

  const post = await Post.findOne({ _id: postId });
  if (!post) return sendError(res, "Post not found!", 404);

  //   create and update new comment
  const newComment = new Comment({
    user: userId,
    parentPost: post._id,
    content,
  });

  // updating Comment for post.
  post.comments.push(newComment._id);
  await post.save();

  // save new comment
  await newComment.save();

  const comments = await getAverageComments(post._id);

  res.json({ message: "New comment added!!", comments });
});

// fetch all comments
exports.getComment = expressAsyncHandler(async (req, res) => {
  const comments = await Comment.find({}).sort({ createdAt: -1 });
  res.json(comments);
});

// fetch single comment by id
exports.getSingleComment = expressAsyncHandler(async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page || 1;

    const allComments = await Comment.find()
      .skip((page - 1) * perPage)
      .populate("postedBy", "name")
      .populate("parentPost", "title slug")
      .sort({ createdAt: -1 })
      .limit(perPage);

    return res.json(allComments);
  } catch (err) {
    console.log(err);
  }
});

exports.userComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postedBy: req.user._id })
      .populate("postedBy", "name")
      .populate("postId", "title slug")
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (err) {
    console.log(err);
  }
};

exports.commentCount = async (req, res) => {
  try {
    const count = await Comment.countDocuments();
    res.json(count);
  } catch (err) {
    console.log(err);
  }
};

// update comment
exports.updateComment = expressAsyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { description } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(commentId)) return sendError(res, "Invalid Comment ID!");

  const comment = await Comment.findByIdAndUpdate({
    user: userId,
    _id: commentId,
  });
  if (!comment) return sendError(res, "Comment not found!", 404);

  comment.description = description;

  await comment.save();

  res.json({ message: "Your comment has been updated.", comment });
});

// delete comment
exports.deleteComment = expressAsyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(commentId)) return sendError(res, "Invalid comment ID!");

  const comment = await Comment.findOne({ user: userId, _id: commentId });

  if (!comment) return sendError(res, "Invalid request, comment not found!");

  await Comment.findByIdAndDelete(commentId);

  res.json({ message: "Comment removed successfully." });
});

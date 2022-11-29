const mongoose = require("mongoose");

const commentSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      max: 20000,
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);

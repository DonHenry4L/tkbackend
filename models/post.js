const mongoose = require("mongoose");

const postSchema = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    content: {},
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    published: { type: Boolean, default: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    featuredImage: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);

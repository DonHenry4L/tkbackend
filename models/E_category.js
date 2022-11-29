const mongoose = require("mongoose");

const e_categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxLength: 32,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("E_Category", e_categorySchema);

const mongoose = require("mongoose");

const e_categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    // slug: {
    //   type: String,
    //   unique: true,
    //   lowercase: true,
    // },
    description: { type: String, default: "default category description" },
    image: { type: String },
    attrs: [{ key: { type: String }, value: [{ type: String }] }],
  },
  { timestamps: true }
);
// e_categorySchema.index({ description: 1 });

module.exports = mongoose.model("E_Category", e_categorySchema);

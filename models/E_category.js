const mongoose = require("mongoose");

const e_categorySchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "default category description" },
  image: { type: String, default: "/images/tablets-category.png" },
  attrs: [{ key: { type: String }, value: [{ type: String }] }],
});
e_categorySchema.index({description: 1})

module.exports = mongoose.model("E_Category", e_categorySchema);

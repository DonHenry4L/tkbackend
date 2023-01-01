const mongoose = require("mongoose");
const Review = require("./Review");

const imageSchema = mongoose.Schema({
  path: { type: String, required: true },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      require: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
    },
    reviewsNumber: {
      type: Number,
    },
    price: {
      type: Number,
      required: true,
    },
    // category: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "E_Category",
    //   required: true,
    // },
    count: {
      type: Number,
      required: true,
    },
    sales: {
      type: Number,
      default: 0,
    },
    attrs: [
      {
        key: {
          type: String,
        },
        value: {
          type: String,
        },
      },
    ],
    images: [imageSchema],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Review,
      },
    ],
    shipping: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true }
);
productSchema.index(
  { name: "text", description: "text" },
  { name: "TextIndex" }
);
productSchema.index({ "attrs.key": 1 });

module.exports = mongoose.model("Product", productSchema);

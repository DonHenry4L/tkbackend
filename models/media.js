const mongoose = require("mongoose");

const mediaSchema = mongoose.Schema(
  {
    url: String,
    public_id: String,
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", mediaSchema);

{
  /*  {
    poster: {
      type: Object,
      url: String,
      public_id: String,
      responsive: [URL],
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true } */
}

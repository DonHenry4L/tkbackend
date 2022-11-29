const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      trim: true,
    },
    receiverId: {
      type: String,
      required: true,
    },
    message: {
      text: {
        type: String,
        default: "",
      },
      image: {
        type: String,
        default: "",
      },
    },
    status: {
      type: String,
      default: "unseen",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TMessages", messageSchema);

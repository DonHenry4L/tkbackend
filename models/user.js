const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
  first_name: {
    type: String,
    trim: true,
    required: true,
  },
  last_name: {
    type: String,
    trim: true,
    required: true,
  },

  username: {
    type: String,
    required: true,
    trim: true,
    text: true,
    unique: true,
    minlength: 4,
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  phone: {
    type: Number,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "Hello There!",
    minlength: 2,
    maxlength: 250,
  },

  picture: {
    type: String,
    trim: true,
    default:
      "https://res.cloudinary.com/dmhcnhtng/image/upload/v1643044376/avatars/default_pic_jeaybr.png",
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    required: true,
    default: "Subscriber",
    // enum: ["admin", "user", "Subscriber"],
  },
  // E-COMMERCE
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  cart: {
    type: Array,
    default: [],
  },
  address: {
    type: String,
    trim: true,
  },
  // wishlist:[{type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  // END E-COMMERCE

  gender: {
    type: String,
    required: [true, "gender is required"],
    trim: true,
  },
  bYear: {
    type: Number,
    required: true,
    trim: true,
  },
  bMonth: {
    type: Number,
    required: true,
    trim: true,
  },
  bDay: {
    type: Number,
    required: true,
    trim: true,
  },

  nationality: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  town: {
    type: String,
    required: true,
    trim: true,
  },
  lga: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  resetCode: "",
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

userSchema.methods.comparePassword = async function (password) {
  const result = await bcrypt.compare(password, this.password);
  return result;
};

module.exports = mongoose.model("User", userSchema);

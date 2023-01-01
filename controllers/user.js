const User = require("../models/user");
const Review = require("../models/Review");
const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const {
  validateEmail,
  validateLength,
  validateUsername,
} = require("../helpers/validation");
const EmailVerificationToken = require("../models/emailVerificationToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateToken } = require("../helpers/tokens");
const { sendVerificationEmail, sendResetCode } = require("../helpers/mailer");
const {
  sendError,
  generateRandomByte,
  comparePassword,
} = require("../utils/helper");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { isValidObjectId } = require("mongoose");
const PasswordResetToken = require("../models/passwordResetToken");

// SENDINBLUE_API //
const Sib = require("sib-api-v3-sdk");
require("dotenv").config();

const client = Sib.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

// END SENDINBLUE_API //

exports.register = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    username,
    picture,
    bYear,
    bMonth,
    bDay,
    phone,
    nationality,
    country,
    town,
    lga,
    state,
    gender,
  } = req.body;

  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return sendError(
      res,
      "This email address already exists,try with a different email address"
    );
  }

  let tempUsername = first_name + last_name;
  let newUsername = await validateUsername(tempUsername);
  const newUser = new User({
    first_name,
    last_name,
    email,
    password,
    username: newUsername,
    picture,
    bYear,
    bMonth,
    bDay,
    phone,
    nationality,
    country,
    town,
    lga,
    state,
    gender,
  });

  await newUser.save();

  // const emailVerificationToken = generateToken(
  //   { id: user._id.toString() },
  //   "30m"
  // );
  // const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
  // sendVerificationEmail(newUser.email, newUser.first_name);
  // const token = generateToken({ id: newUser._id.toString() }, "7d");

  // generate 6 digit otp
  let OTP = generateOTP();

  // store otp inside our db
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: newUser._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();
  // send that otp to our user

  // prepare email
  const tranEmailApi = new Sib.TransactionalEmailsApi();

  const sender = {
    email: process.env.VERIFICATION_EMAIL,
    name: "TKF",
    templateId: 1,
    params: {
      greeting: `Hello`,
      headline: "This Message is from Tksarl.com",
    },
  };

  const receivers = [
    {
      email: newUser.email,
    },
  ];

  tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Email Verification",

    htmlContent: `<p>Your verification OTP</p>
  <h1>${OTP}</h1>`,
  });

  res
    .cookie(
      "access_token",
      generateToken(
        newUser._id,
        newUser.first_name,
        newUser.last_name,
        newUser.email,
        newUser.isAdmin,
        newUser.role
      ),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      }
    )
    .status(201)
    .json({
      user: {
        id: newUser._id,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
        picture: newUser.picture,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        message: "Register Success ! please activate your email to start",
      },
    });
};

exports.login = async (req, res) => {
  const { email, password, doNotLogout } = req.body;

  if (!(email && password)) {
    return res.status(400).json("All inputs are required");
  }

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Email is not found in Database!");

  // const matched = await user.comparePassword(password);
  // if (!matched) return sendError(res, "Email/Password mismatch!");

  if (user && comparePassword(password, user.password)) {
    let cookieParams = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    if (doNotLogout) {
      cookieParams = { ...cookieParams, maxAge: 1000 * 60 * 60 * 24 * 7 }; //1000=lms
    }
    return res
      .cookie(
        "access_token",
        generateToken(
          user._id,
          user.first_name,
          user.last_name,
          user.email,
          user.isAdmin,
          user.role
        ),
        cookieParams
      )
      .json({
        success: "User logged in",
        userLoggedIn: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          isAdmin: user.isAdmin,
          role: user.role,
          doNotLogout,
        },
      });
  } else {
    return sendError(res, "Email/Password mismatch!");
  }

  // const {
  //   _id,
  //   first_name,
  //   last_name,
  //   isAdmin,
  //   picture,
  //   username,
  //   isVerified,
  //   role,
  // } = user;

  // const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

  // res.json({
  //   user: {
  //     id: _id,
  //     first_name: first_name,
  //     last_name: last_name,
  //     username: username,
  //     picture: picture,
  //     email: email,
  //     isAdmin: isAdmin,
  //     token: jwtToken,
  //     verified: isVerified,
  //     role: role,
  //   },
  // });

  // res.json({
  //   user: { id: _id, name, email, role, token: jwtToken, isVerified },
  // });
};

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;

  if (!isValidObjectId(userId)) return res.json({ error: "Invalid user!" });

  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!", 404);

  if (user.isVerified) return sendError(res, "user is already verified!");

  const token = await EmailVerificationToken.findOne({ owner: userId });
  if (!token) return sendError(res, "token not found!");

  const isMatched = await token.compareToken(OTP);
  if (!isMatched) return sendError(res, "Please submit a valid OTP!");

  user.isVerified = true;
  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      isVerified: user.isVerified,
      role: user.role,
    },
    message: "Your email is verified.",
  });
};

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return sendError(res, "user not found!");

  if (user.isVerified)
    return sendError(res, "This email id is already verified!");

  const alreadyHasToken = await EmailVerificationToken.findOne({
    owner: userId,
  });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );

  sendVerificationEmail(user.email, user.first_name);
  const token = generateToken({ id: user._id.toString() }, "7d");
  res.send({
    id: user._id,
    username: user.username,
    picture: user.picture,
    first_name: user.first_name,
    last_name: user.last_name,
    token: token,
    verified: user.verified,
    message: "New OTP has been sent to your registered email account.",
  });
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    return res.json(users);
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.first_name = req.body.first_name || user.first_name;
    user.last_name = req.body.last_name || user.last_name;
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.gender = req.body.gender || user.gender;
    user.nationality = req.body.nationality || user.nationality;
    user.country = req.body.country || user.country;
    user.town = req.body.town || user.town;
    user.lga = req.body.lga || user.lga;
    user.state = req.body.state || user.state;
    user.picture = req.body.picture;
    user.address = req.body.address;
    if (req.body.password !== user.password) {
      user.password = req.body.password;
    }

    //   const matched = await user.comparePassword(password);
    // if (!matched) return req.body.password
    await user.save();

    res.json({
      success: "user updated",
      userUpdated: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        picture: user.picture,
        phone: user.phone,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
      },
    });
  } catch (error) {
    if (error) return sendError(res, "failed to update");
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    return res.send(user);
  } catch (error) {
    if (error) return sendError(res, "failed to Get User Profile");
  }
};

exports.writeReview = async (req, res) => {
  try {
    const session = await Review.startSession();

    // get comment, rating from request.body:
    const { comment, rating } = req.body;
    // validate request:
    if (!(comment && rating)) {
      return res.status(400).send("All inputs are required");
    }

    // create review id manually because it is needed also for saving in Product collection
    const ObjectId = require("mongodb").ObjectId;
    let reviewId = ObjectId();

    session.startTransaction();

    await Review.create(
      [
        {
          _id: reviewId,
          comment: comment,
          rating: Number(rating),
          user: { _id: req.user._id, name: req.user.username },
        },
      ],
      { session: session }
    );

    const product = await Product.findById(req.params.productId)
      .populate("reviews")
      .session(session);

    const alreadyReviewed = product.reviews.find(
      (r) => r.user._id.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send("product already reviewed");
    }

    let prc = [...product.reviews];
    prc.push({ rating: rating });
    product.reviews.push(reviewId);
    if (product.reviews.length === 1) {
      product.rating = Number(rating);
      product.reviewsNumber = 1;
    } else {
      product.reviewsNumber = product.reviews.length;
      product.rating =
        prc
          .map((item) => Number(item.rating))
          .reduce((sum, item) => sum + item, 0) / product.reviews.length;
    }
    await product.save();

    await session.commitTransaction();
    session.endSession();
    res.send("review created");
  } catch (error) {
    await session.abortTransaction();
    return res.status(400).send("Failed to create a review");
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "username first_name last_name email isAdmin role"
    );
    return res.send(user);
  } catch (error) {
    return res.status(400).send("Failed to fetch user from the database");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.first_name = req.body.first_name || user.first_name;
    user.last_name = req.body.last_name || user.last_name;
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isAdmin = req.body.isAdmin || user.isAdmin; // same with role

    await user.save();

    res.send("user Updated");
  } catch (error) {
    return res.status(400).send("Failed to Update User");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await user.remove();
    res.send("user removed");
  } catch (error) {
    return res.status(400).send("Failed to Delete User");
  }
};

// CHAT
//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
exports.allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

exports.currentUser = async (req, res) => {
  try {
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
};

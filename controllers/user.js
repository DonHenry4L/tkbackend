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
const bcrypt = require("bcryptjs");
const { generateToken, generateCookieToken } = require("../helpers/tokens");
const { sendVerificationEmail, sendResetCode } = require("../helpers/mailer");
const {
  sendError,
  generateRandomByte,
  comparePassword,
} = require("../utils/helper");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { isValidObjectId } = require("mongoose");
const PasswordResetToken = require("../models/passwordResetToken");
const crypto = require("crypto");

// SENDINBLUE_API //
const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
// END SENDINBLUE_API //

// TWILIO_API //
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioClient = require("twilio")(accountSid, authToken);
// END TWILIO_API //

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
    country,
    address,
    city,
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
    country,
    address,
    city,
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

  // prepare email and sms
  //Email
  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  // let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  // //Sms
  // let apiInstance = new SibApiV3Sdk.TransactionalSMSApi();
  // let sendTransacSms = new SibApiV3Sdk.SendTransacSms();

  // sendTransacSms = {
  //   sender: "TKfamily",
  //   receiver: newUser.phone,
  //   content: `<p>Your Tkfamily verification OTP</p>
  //   <h1>${OTP}</h1>`,
  // };

  // apiInstance.sendTransacSms(sendTransacSms).then(
  //   function (data) {
  //     console.log(
  //       "Sms successfully sent to recipient: " + JSON.stringify(data)
  //     );
  //   },
  //   function (error) {
  //     console.error(error);
  //   }
  // );

  // sendSmtpEmail.sender = {
  //   email: process.env.VERIFICATION_EMAIL,
  //   name: "TKF",
  // };

  // sendSmtpEmail.to = {
  //   email: newUser.email,
  //   name: newUser.username,
  // };

  // sendSmtpEmail.subject = "This Message is from Tksarl.com";

  // sendSmtpEmail.htmlContent = `<p>Your verification OTP</p>
  //  <h1>${OTP}</h1>`;

  // tranEmailApiInstant.sendTransacEmail(sendSmtpEmail).then(
  //   function (data) {
  //     console.log(
  //       "Email successfully sent to recipient: " + JSON.stringify(data)
  //     );
  //   },
  //   function (error) {
  //     console.log(error);
  //   }
  // );

  const sender = {
    email: process.env.VERIFICATION_EMAIL,
    name: "TKF",
  };

  const receivers = [
    {
      email: newUser.email,
    },
  ];
  // const smsReceivers = [
  //   {
  //     phone: newUser.phone,
  //   },
  // ];

  tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Email Verification",

    htmlContent: `<p>Your verification OTP</p>
  <h1>${OTP}</h1>`,
  });

  // sendTransacSms = {
  //   sender: "tkfamily",
  //   recipient: "+2348065744999",
  //   subject: "SMS Verification",

  //   content: `<p>Your verification OTP</p>
  // <h1>${OTP}</h1>`,
  // };
  // apiInstance.sendTransacSms(sendTransacSms).then(
  //   function (data) {
  //     console.log(
  //       "API called successfully. Returned data: " + JSON.stringify(data)
  //     );
  //   },
  //   function (error) {
  //     console.error(error);
  //   }
  // );

  {
    /* TWILIO */
  }
  // TO DO: buy a twilio phone number first
  // twilioClient.messages
  //   .create({
  //     from: "+2348065744999",
  //     to: newUser.phone,
  //     body: `<p>Your verification OTP</p>
  //     <h1>${OTP}</h1>`,
  //   })
  //   .then((message) => console.log(message.sid))
  //   .done();
  {
    /* TWILIO */
  }

  res
    .cookie(
      "access_token",
      generateCookieToken(
        newUser._id,
        newUser.first_name,
        newUser.last_name,
        newUser.email,
        newUser.phone,
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

// create User by Admin
exports.createUser = async (req, res) => {
  try {
    // console.log(req.body);
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      role,
      checked,
      isAdmin,
      website,
    } = req.body;
    if (!first_name && !last_name) {
      return sendError(res, "Name is Required!");
    }
    if (!email) {
      return sendError(res, "Email is Required!");
    }
    if (!password || password.length < 8) {
      return sendError(
        res,
        "Password is required and should be 8 characters long!"
      );
    }
    // if user exists
    const exist = await User.findOne({ email });
    if (exist) {
      sendError(res, "Email is taken");
    }

    // if checked, send Email with login details
    if (checked) {
      // prepare email
      const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

      const sender = {
        email: process.env.EMAIL_FROM,
        name: "TKF",
      };

      const receivers = [
        {
          email: email,
        },
      ];

      tranEmailApi.sendTransacEmail({
        sender,
        to: receivers,
        subject: "Account Created",

        htmlContent: `
    <h1>Hi ${last_name}</h1>
        <p>Your Royal KATD account has been created successfully.</p>
        <h3>Your login details</h3>
        <p style="color:red;">Email: ${email}</p>
        <p style="color:red;">Password: ${password}</p>
        <p style="color:green;">Website: ${website} (we can make your business go online, if interested, contact support)</p>
        <small>We recommend you to change your password after login.</small>
    `,
      });
    }

    let tempUsername = first_name + last_name;
    let newUsername = await validateUsername(tempUsername);

    try {
      const user = new User({
        first_name,
        last_name,
        username: newUsername,
        email,
        password,
        role,
        isAdmin,
        website,
      });

      await user.save();

      // const { password, ...rest } = user._doc;
      return res.json({
        user: {
          id: user._id,
          isAdmin: user.isAdmin,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          website: user.website,
        },
      });
    } catch (err) {
      console.log(err);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.login = async (req, res) => {
  const { email, password, doNotLogout } = req.body;

  if (!(email && password)) {
    return res.status(400).json("All inputs are required");
  }

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Email/Password mismatch!");

  const matched = await user.comparePassword(password);
  if (!matched) return sendError(res, "Email/Password mismatch!");

  let cookieParams = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  if (doNotLogout) {
    cookieParams = { ...cookieParams, maxAge: 1000 * 60 * 60 * 24 * 7 }; //1000=lms
  }

  const {
    _id,
    first_name,
    last_name,
    picture,
    username,
    isVerified,
    role,
    isAdmin,
  } = user;
  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);
  return res
    .cookie(
      "access_token",
      generateCookieToken(
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
      user: {
        _id: _id,
        first_name,
        last_name,
        picture,
        username,
        email,
        role,
        isAdmin,
        token: jwtToken,
        isVerified,
        doNotLogout,
      },
      // user: {
      //   _id: user._id,
      //   first_name: user.first_name,
      //   last_name: user.last_name,
      //   email: user.email,
      //   isAdmin: user.isAdmin,
      //   // token: jwtToken,
      //   role: user.role,
      //   picture: user.picture,
      //   username: user.username,
      //   isVerified: user.isVerified,
      //   doNotLogout,
      // },
    });

  // res.json({
  //   user: {
  //     id: _id,
  //     first_name,
  //     last_name,
  //     picture,
  //     username,
  //     email,
  //     role,
  //     isAdmin,
  //     token: jwtToken,
  //     isVerified,
  //     doNotLogout,
  //   },
  // });

  // if (user && comparePassword(password, user.password)) {
  //   let cookieParams = {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === "production",
  //     sameSite: "strict",
  //   };

  //   if (doNotLogout) {
  //     cookieParams = { ...cookieParams, maxAge: 1000 * 60 * 60 * 24 * 7 }; //1000=lms
  //   }
  //   return res
  //     .cookie(
  //       "access_token",
  //       generateToken(
  //         user._id,
  //         user.first_name,
  //         user.last_name,
  //         user.email,
  //         user.isAdmin,
  //         user.role
  //       ),
  //       cookieParams
  //     )
  //     .json({
  //       success: "User logged in",
  //       userLoggedIn: {
  //         _id: user._id,
  //         first_name: user.first_name,
  //         last_name: user.last_name,
  //         email: user.email,
  //         isAdmin: user.isAdmin,
  //         role: user.role,
  //         doNotLogout,
  //       },
  //     });
  // } else {
  //   return sendError(res, "Email/Password mismatch!");
  // }

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

  // try {
  //   const { email, password, doNotLogout } = req.body;
  //   if (!(email && password)) {
  //     return res.status(400).send("All inputs are required");
  //   }

  //   const user = await User.findOne({ email }).orFail();
  //   const matched = await user.comparePassword(password);
  //   if (!matched) return sendError(res, "Email/Password mismatch!");

  //   let cookieParams = {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === "production",
  //     sameSite: "strict",
  //   };

  //   if (doNotLogout) {
  //     cookieParams = { ...cookieParams, maxAge: 1000 * 60 * 60 * 24 * 7 }; // 1000=1ms
  //   }

  //   return res
  //     .cookie(
  //       "access_token",
  //       generateCookieToken(
  //         user._id,
  //         user.first_name,
  //         user.last_name,
  //         user.email,
  //         user.isAdmin
  //       ),
  //       cookieParams
  //     )
  //     .json({
  //       success: "user logged in",
  //       user: {
  //         _id: user._id,
  //         first_name: user.first_name,
  //         last_name: user.last_name,
  //         email: user.email,
  //         isAdmin: user.isAdmin,
  //         doNotLogout,
  //       },
  //     });
  // } catch (err) {
  //   sendError(res, "unable to login: Server Error!");
  // }
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

  //

  let OTP = generateOTP();

  // store otp inside our db
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: user._id,
    token: OTP,
  });

  await newEmailVerificationToken.save();
  // send that otp to our user

  // prepare email and sms
  //Email
  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const sender = {
    email: process.env.VERIFICATION_EMAIL,
    name: "TKF",
  };

  const receivers = [
    {
      email: user.email,
    },
  ];

  tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Email Verification",

    htmlContent: `<p>Your verification OTP</p>
    <h1>${OTP}</h1>`,
  });

  //

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
    user.country = req.body.country || user.country;
    user.city = req.body.city || user.city;
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
    const user = await User.findById(req.params.id).populate("picture");
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
      let ratingCalc =
        prc
          .map((item) => Number(item.rating))
          .reduce((sum, item) => sum + item, 0) / product.reviews.length;
      product.rating = Math.round(ratingCalc);
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
    user.role = req.body.role;
    user.isAdmin = req.body.isAdmin; // same with role

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

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, "email is invalid");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found", 404);

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
  if (alreadyHasToken)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );

  const token = await generateRandomByte();
  const newPasswordResetToken = await PasswordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();

  const resetPasswordUrl = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`;

  // prepare email
  //Email
  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const sender = {
    email: process.env.PASSWORD_RESET_LINK,
    name: "TKF",
    templateId: 1,
    params: {
      greeting: `Hello`,
      headline: "This Message is from Tksarl.com",
    },
  };

  const receivers = [
    {
      email: user.email,
    },
  ];

  tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Reset Password Link",

    htmlContent: `<p>Click here to reset your password</p>
  <a href='${resetPasswordUrl}'>Change Password</a>`,
  });

  res.json({ message: "Link sent to your email" });
};

exports.sendResetPasswordTokenStatus = (req, res) => {
  res.json({ valid: true });
};
exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;

  // find the user by id
  const user = await User.findById(userId);
  // check if the passwords are the same
  const matched = await user.comparePassword(newPassword);
  if (matched)
    return sendError(
      res,
      "The new password must be different from the old one!"
    );

  user.password = newPassword;
  await user.save();

  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);

  // prepare confirmation email
  //Email
  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const sender = {
    email: process.env.PASSWORD_VERIFICATION,
    name: "TKF",
  };

  const receivers = [
    {
      email: user.email,
    },
  ];

  tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Password Reset Successfully",

    htmlContent: `<h1>Password Reset Successfully</h1>
  <p>Now You can use new Password</p>`,
  });

  res.json({
    message: "password reset successfully, now you can use new password",
  });
};

exports.updateUserByAdmin = async (req, res) => {
  try {
    const {
      id,
      first_name,
      last_name,
      email,
      password,
      website,
      role,
      isAdmin,
      picture,
    } = req.body;

    const userFromDb = await User.findById(id);

    // check valid email
    if (!validateEmail.validate(email)) {
      return res.json({ error: "Invalid email" });
    }
    // check if email is taken
    const exist = await User.findOne({ email });
    if (exist && exist._id.toString() !== userFromDb._id.toString()) {
      return res.json({ error: "Email is taken" });
    }
    // check password length
    if (password && password.length < 6) {
      return res.json({
        error: "Password is required and should be 6 characters long",
      });
    }
    const updated = await User.findByIdAndUpdate(
      id,
      {
        first_name: first_name || userFromDb.first_name,
        last_name: last_name || userFromDb.last_name,
        email: email || userFromDb.email,
        password: password || userFromDb.password,
        website: website || userFromDb.website,
        role: role || userFromDb.role,
        isAdmin: isAdmin || userFromDb.isAdmin,
        picture: picture || userFromDb.picture,
      },
      { new: true }
    ).populate("picture");

    res.json(updated);
  } catch (err) {
    console.log(err);
  }
};

exports.updateUserByUser = async (req, res) => {
  try {
    const {
      id,
      first_name,
      last_name,
      email,
      password,
      username,
      picture,
      phone,
      country,
      address,
      city,
      state,
      website,
    } = req.body;

    const userFromDb = await User.findById(id);

    // // check if user is himself/herself
    // if (userFromDb._id.toString() !== req.user._id.toString()) {
    //   return res.status(403).send("You are not allowed to update this user");
    // }

    // check valid email
    if (!validateEmail(email)) {
      return res.json({ error: "Invalid email" });
    }
    // check if email is taken
    const exist = await User.findOne({ email });
    if (exist) {
      return res.json({ error: "Email is taken" });
    }
    // check password length
    if (password && password.length < 8) {
      return res.json({
        error: "Password is required and should be 8 characters long",
      });
    }
    const updated = await User.findByIdAndUpdate(
      id,
      {
        first_name: first_name || userFromDb.first_name,
        last_name: last_name || userFromDb.last_name,
        username: username || userFromDb.username,
        email: email || userFromDb.email,
        phone: phone || userFromDb.phone,
        country: country || userFromDb.country,
        city: city || userFromDb.city,
        state: state || userFromDb.state,
        website: website || userFromDb.website,
        address: address || userFromDb.address,
        // role: role || userFromDb.role,
        picture: picture || userFromDb.picture,
        password: password || userFromDb.password,
      },
      { new: true }
    ).populate("picture");

    res.json(updated);
  } catch (err) {
    console.log(err);
  }
};

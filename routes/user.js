const express = require("express");
const jwt = require("jsonwebtoken");

const {
  register,
  login,
  createUser,
  verifyEmail,
  currentUser,
  allUsers,
  getUsers,
  updateUserByUser,
  getUserProfile,
  writeReview,
  getUser,
  updateUser,
  deleteUser,
  forgetPassword,
  sendResetPasswordTokenStatus,
  resetPassword,
  resendEmailVerificationToken,
} = require("../controllers/user");
const {
  isAuth,
  isAdmin,
  isAuthor,
  isASubscriber,
} = require("../middlewares/auth");
const { isValidPassResetToken } = require("../middlewares/user");
const {
  signInValidator,
  validate,
  userValidator,
  validatePassword,
} = require("../middlewares/validator");
const router = express.Router();

router.post("/register", userValidator, validate, register);
// create user by admin
router.post("/create-user", isAuth, isAdmin, createUser);

router.post("/login", signInValidator, validate, login);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post("/forget-password", forgetPassword);
router.post(
  "/verify-pass-reset-token",
  isValidPassResetToken,
  sendResetPasswordTokenStatus
);
router.post(
  "/reset-password",
  validate,
  validatePassword,
  isValidPassResetToken,
  resetPassword
);

router.get("/allUsers", isAuth, isAdmin, allUsers);
router.put("/profile", isAuth, updateUserByUser);
router.get("/profile/:id", isAuth, getUserProfile);

// Users routes for E commerce
router.post("/user/review/:productId", isAuth, writeReview);

// Admin routes for E commerce
router.get("/", isAuth, isAdmin, getUsers);
router.get("/:id", isAuth, isAdmin, getUser);
router.put("/:id", isAuth, isAdmin, updateUser);
router.delete("/:id", isAuth, isAdmin, deleteUser);

// Auth Handlers
// router.get("/current-author", isAuth, isAuthor, currentUser);
// router.get("/subscriber", isAuth, isASubscriber, currentUser);

// router.get("/get-token", (req, res) => {
//   try {
//     const accessToken = req.cookies["access_token"]
//     const decode = jwt.verify(accessToken, process.env.JWT_SECRET)
//     return res.json({token: decode.first_name, isAdmin: decode.isAdmin})
//   } catch (error) {
//     return res.status(401).send("Unable to authenticate. Invalid Token")
//   }
// })

router.get("/logout", (req, res) => {
  return res.clearCookie("access_token").send("access token cleared");
});

// router.get("/is-auth", isAuth, (req, res) => {
//   const { user } = req;
//   res.json({
//     user: {
//       id: user._id,
//       first_name: user.first_name,
//       last_name: user.last_name,
//       username: user.username,
//       picture: user.picture,
//       email: user.email,
//       isVerified: user.isVerified,
//       role: user.role,
//       isAdmin: user.isAdmin
//     },
//   });
// });

module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");

const {
  register,
  login,
  verifyEmail,
  currentUser,
  allUsers,
  getUsers,
  updateUserProfile,
  getUserProfile,
  writeReview,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/user");
const { isAuth, isAdmin, isAuthor } = require("../middlewares/auth");
const {
  signInValidator,
  validate,
  userValidator,
} = require("../middlewares/validator");
const router = express.Router();

router.post("/register", userValidator, validate, register);
router.post("/login", signInValidator, validate, login);
router.post("/verify-email", verifyEmail);

router.get("/allUsers", isAuth, isAdmin, allUsers);

// Users routes for E commerce
router.put("/user/profile", isAuth, updateUserProfile);
router.get("/user/profile/:id", isAuth, getUserProfile);
router.post("/user/review/:productId", isAuth, writeReview);

// Admin routes for E commerce
router.get("/users", isAuth, isAdmin, getUsers);
router.get("/user/:id", isAuth, isAdmin, getUser);
router.put("/user/:id", isAuth, isAdmin, updateUser);
router.delete("/user/:id", isAuth, isAdmin, deleteUser);

// Auth Handlers
router.get("/current-author", isAuth, isAuthor, currentUser);
router.get("/current-subscriber", currentUser);

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
  return res.clearCookie("access_token").send("access token cleared")
})

router.get("/is-auth", isAuth, (req, res) => {
  const { user } = req;
  res.json({
    user: {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      picture: user.picture,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,
      isAdmin: user.isAdmin
    },
  });
});

module.exports = router;

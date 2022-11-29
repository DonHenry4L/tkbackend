const express = require("express");

const {
  register,
  login,
  verifyEmail,
  currentUser,
  allUsers,
} = require("../controllers/user");
const { isAuth, isAuthor } = require("../middlewares/auth");
const {
  signInValidator,
  validate,
  userValidator,
} = require("../middlewares/validator");
const router = express.Router();

router.post("/register", userValidator, validate, register);
router.post("/login", signInValidator, validate, login);
router.post("/verify-email", verifyEmail);

router.get("/allUsers", isAuth, allUsers);

// Auth Handlers
router.get("/current-author", isAuth, isAuthor, currentUser);
router.get("/current-subscriber", isAuth, currentUser);

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
    },
  });
});

module.exports = router;

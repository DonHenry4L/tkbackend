const router = require("express").Router();

const {
  userRegister,
  userLogin,
  userLogout,
} = require("../controllers/authController");
// const { isAuth } = require("../middlewares/auth");
const { authMiddleware } = require("../middlewares/authMiddleware");
// Login Register Route
router.post("/user-login", userLogin);
router.post("/user-register", userRegister);
router.post("/user-logout", authMiddleware, userLogout);

module.exports = router;

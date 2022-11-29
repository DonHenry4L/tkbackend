const { check, validationResult } = require("express-validator");

exports.userValidator = [
  check("first_name")
    .trim()
    .not()
    .isEmpty()
    .withMessage("First Name is missing!"),
  check("last_name")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Last Name is missing!"),
  check("email").normalizeEmail().isEmail().withMessage("Email is invalid!"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8 to 20 characters long!"),
];

exports.validatePassword = [
  check("newPassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is missing!")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8 to 20 characters long!"),
];

exports.signInValidator = [
  check("email")
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid Email Address!"),
  check("password").trim().not().isEmpty().withMessage("Password is missing!"),
];

exports.validatePost = [
  check("title").trim().not().isEmpty().withMessage("Post title is missing!"),
];

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (error.length) {
    return res.json({ error: error[0].msg });
  }

  next();
};

const express = require("express");
const { createComment } = require("../controllers/comment");
const { isAuth } = require("../middlewares/auth");
const router = express.Router();

// Comments
router.post("/comment/:postId", createComment);

module.exports = router;

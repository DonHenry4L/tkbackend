const express = require("express");
const formidable = require("express-formidable");
const { validate, validatePost } = require("../middlewares/validator");

const {
  createPost,
  posts,
  removePost,
  singlePost,
  postCount,
  postsForAdmin,
  uploadImage,
  uploadImageFile,
  removeMedia,
  createComment,
  media,
  comments,
  editPost,
  postsByAuthor,
  updateComment,
  removeComment,
  userComments,
  commentCount,
} = require("../controllers/post");
const {
  isAdmin,
  isAuth,
  canCreateRead,
  canUpdateDeletePost,
  canDeleteMedia,
  canUpdateDeleteComment,
} = require("../middlewares/auth");
const router = express.Router();

router.post(
  "/create-post",
  isAuth,
  canCreateRead,
  validate,
  validatePost,
  createPost
);

// isAdmin,
// uploadImage.single("poster"),
router.post("/upload-image", isAuth, canCreateRead, uploadImage);
router.post(
  "/upload-image-file",
  isAuth,
  formidable(),
  canCreateRead,
  uploadImageFile
);
router.get("/posts", posts);
router.get("/:slug", singlePost);
router.delete("/post/:postId", isAuth, canUpdateDeletePost, removePost);
router.put("/edit-post/:postId", isAuth, canUpdateDeletePost, editPost);
router.get("/post-count", postCount);
router.get("/posts-for-admin", isAuth, isAdmin, postsForAdmin);
router.get("/posts-by-author", isAuth, postsByAuthor);
// media
router.get("/media", isAuth, canCreateRead, media);
router.delete("/media/:id", isAuth, canUpdateDeletePost, removeMedia);

// Comments
router.post("/createComment/:postId", isAuth, createComment);
router.get("/comments/:page", isAuth, isAdmin, comments);
router.get("/user-comments", isAuth, userComments);
router.get("/comment-count", commentCount);
router.put(
  "/comment/:commentId",
  isAuth,
  canUpdateDeleteComment,
  updateComment
);
router.delete(
  "/comment/:commentId",
  isAuth,
  canUpdateDeleteComment,
  removeComment
);

module.exports = router;

const router = require("express").Router();
const {
  createCategory,
  categories,
  deleteCategory,
  updateCategory,
} = require("../controllers/category");
const { isAuth, isAdmin } = require("../middlewares/auth");

router.post("/category", isAuth, isAdmin, createCategory);
router.get("/categories", categories);
router.delete("/category/:slug", isAuth, isAdmin, deleteCategory);
router.put("/category/:slug", isAuth, isAdmin, updateCategory);

module.exports = router;

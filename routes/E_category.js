const router = require("express").Router();
const {
  newCategory,
  updateE_category,
  deleteCategory,
  getCategories,
  read,
  saveAttributes,
} = require("../controllers/e_category");
const { isAuth, isAdmin } = require("../middlewares/auth");

// create Category
router.post("/",isAuth, isAdmin, newCategory);
// post Category Attributes
router.post("/attr",isAuth, isAdmin, saveAttributes);

// update Category
// router.put("/e_category/:categoryId", isAuth, isAdmin, updateE_category);
// Delete Category
router.delete("/:categoryId", isAuth, isAdmin, deleteCategory);
// Get all category
router.get("/", getCategories);
// get single Category
// router.get("/e_category/:slug", read);

module.exports = router;

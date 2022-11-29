const router = require("express").Router();
const {
  e_category,
  updateE_category,
  removeE_category,
  list,
  read,
} = require("../controllers/e_category");
const { isAuth, isAdmin } = require("../middlewares/auth");

// create Category
router.post("/e_category", isAuth, isAdmin, e_category);
// update Category
router.put("/e_category/:categoryId", isAuth, isAdmin, updateE_category);
// Delete Category
router.delete("/e_category/:categoryId", isAuth, isAdmin, removeE_category);
// Get all category
router.get("/e_categories", list);
// get single Category
router.get("/e_category/:slug", read);

module.exports = router;

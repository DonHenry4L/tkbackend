const router = require("express").Router();
const formidable = require("express-formidable");
const {
  createProduct,
  list,
  read,
  photo,
  remove,
  update,
} = require("../controllers/product");
const { isAuth, isAdmin } = require("../middlewares/auth");

// create Product
router.post("/product", isAuth, isAdmin, formidable(), createProduct);
router.get("/products", list);
router.get("/product/:slug", read);
router.get("/product/photo/:productId", photo);
router.delete("/product/:productId", isAuth, isAdmin, remove);
router.put("/product/:productId", isAuth, isAdmin, formidable(), update);

module.exports = router;

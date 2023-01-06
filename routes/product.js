const router = require("express").Router();
const formidable = require("express-formidable");
const {
  createProduct,
  getProducts,
  photo,
  remove,
  update,
  getProductById,
  getBestSellers,
  adminGetProducts,
  adminDeleteProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminUpload,
  adminDeleteProductImage,
} = require("../controllers/product");
const { isAuth, isAdmin } = require("../middlewares/auth");

// create Product
// router.post("/product", isAuth, isAdmin, formidable(), createProduct);

// router.get("/product/photo/:productId", photo);
// router.delete("/product/:productId", isAuth, isAdmin, remove);
// router.put("/product/:productId", isAuth, isAdmin, formidable(), update);

router.get("/", getProducts);
router.get("/category/:categoryName", isAuth, getProducts);
router.get(
  "/category/:categoryName/search/:searchQuery",
  isAuth,
  getProducts
);
router.get("/search/:searchQuery", isAuth, getProducts);
router.get("/get-one/:id", isAuth, getProductById);
router.get("/bestSellers", isAuth, getBestSellers);

// admin routes
router.post("/admin", isAuth, isAdmin, adminCreateProduct);
router.post("/admin/upload", isAuth, isAdmin, adminUpload);
router.get("/admin", isAuth, isAdmin, adminGetProducts);
router.delete("/admin/:id", isAuth, isAdmin, adminDeleteProducts);
router.delete(
  "/admin/image/:imagePath/:productId",
  isAuth,
  isAdmin,
  adminDeleteProductImage
);
router.put("/admin/:id", isAuth, isAdmin, adminUpdateProduct);

module.exports = router;

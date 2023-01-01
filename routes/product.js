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

router.get("/products", getProducts);
router.get("/products/category/:categoryName", isAuth, getProducts);
router.get(
  "/products/category/:categoryName/search/:searchQuery",
  isAuth,
  getProducts
);
router.get("/products/search/:searchQuery", isAuth, getProducts);
router.get("/products/get-one/:id", isAuth, getProductById);
router.get("/products/bestSellers", isAuth, getBestSellers);

// admin routes
router.post("/products/admin", isAuth, isAdmin, adminCreateProduct);
router.post("/products/admin/upload", isAuth, isAdmin, adminUpload);
router.get("/products/admin", isAuth, isAdmin, adminGetProducts);
router.delete("/products/admin/:id", isAuth, isAdmin, adminDeleteProducts);
router.delete(
  "/products/admin/image/:imagePath/:productId",
  isAuth,
  isAdmin,
  adminDeleteProductImage
);
router.put("/products/admin/:id", isAuth, isAdmin, adminUpdateProduct);

module.exports = router;

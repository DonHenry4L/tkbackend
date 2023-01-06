const express = require("express");
const {
  getUserOrders,
  getOrder,
  createOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  getOrderForAnalysis,
} = require("../controllers/order");
const { isAuth, isAdmin } = require("../middlewares/auth");
const router = express.Router();

// user routes
router.get("/", isAuth, getUserOrders);
router.get("/user/:id", isAuth, getOrder);
router.post("/createOrder", isAuth, createOrder);
router.put("/paid/:id", isAuth, updateOrderToPaid);

// admin routes
router.put("/delivered/:id", isAuth, isAdmin, updateOrderToDelivered);
router.get("/admin/getOrders", isAuth, isAdmin, getOrders);
router.get("/analysis/:date", isAuth, isAdmin, getOrderForAnalysis);

module.exports = router;

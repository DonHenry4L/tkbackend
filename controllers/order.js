const { sendError } = require("../utils/helper");
const Order = require("../models/orderModel");
const Product = require("../models/product");
const ObjectId = require("mongodb").ObjectId;

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: ObjectId(req.user._id) });

    res.send(orders);
  } catch (error) {
    if (error) return sendError(res, "No orders found");
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "-password -isAdmin -role -_id -__v -createdAt -updatedAt"
    );
    res.send(order);
  } catch (error) {
    if (error) return sendError(res, "No order were found");
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { cartItems, orderTotal, paymentMethod } = req.body;
    if (!cartItems || !orderTotal || !paymentMethod) {
      return res.status(400).send("All inputs are required");
    }

    let ids = cartItems.map((item) => {
      return item.productID;
    });
    let qty = cartItems.map((item) => {
      return Number(item.quantity);
    });

    await Product.find({ _id: { $in: ids } }).then((products) => {
      products.forEach(function (product, idx) {
        product.sales += qty[idx];
        product.save();
      });
    });

    const order = new Order({
      user: ObjectId(req.user._id),
      orderTotal: orderTotal,
      cartItems: cartItems,
      paymentMethod: paymentMethod,
    });
    const createdOrder = await order.save();
    res.status(201).send(createdOrder);
  } catch (err) {
    if (err) return sendError(res, "Unable to create Order at this time");
  }
};

exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    order.isPaid = true;
    order.paidAt = Date.now();

    const updateOrder = await order.save();
    res.send(updateOrder);
  } catch (error) {
    if (error) return sendError(res, "Order error from database");
  }
};

exports.updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updateOrder = await order.save();
    res.send(updateOrder);
  } catch (error) {
    if (error) return sendError(res, "Order error from database");
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "-password").sort({
      paymentMethod: "desc",
    });
    res.send(orders);
  } catch (error) {
    if (error) return sendError(res, "Unable to get Orders");
  }
};

exports.getOrderForAnalysis = async (req, res) => {
  try {
    const start = new Date(req.params.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(req.params.date);
    end.setHours(23, 59, 59, 999);

    const order = await Order.find({
      createdAt: {
        $gte: start,
        $lt: end,
      },
    }).sort({ createdAt: "asc" });
    res.send(order);
  } catch (error) {
    if (error) {
      return res.status(400).send(error);
    }
  }
};

const Product = require("../models/product");
const fs = require("fs");
const slugify = require("slugify");

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    // Validation
    switch (true) {
      case !name.trim():
        res.json({ error: "Name is required!" });
      case !description.trim():
        res.json({ error: "Description is required!" });
      case !price.trim():
        res.json({ error: "Price is required!" });
      case !category.trim():
        res.json({ error: "Category is required!" });
      case !quantity.trim():
        res.json({ error: "Quantity is required!" });
      case !shipping.trim():
        res.json({ error: "Shipping is required!" });
      case photo && photo.size > 100000:
        res.json({ error: "Image should be less than 1mb in size!" });
    }
    // create Products

    const product = new Product({ ...req.fields, slug: slugify(name) });
    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }
    await product.save();
    res.json(product);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.list = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.read = async (req, res) => {
  try {
    const products = await Product.findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");

    res.json(products);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.photo = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select(
      "photo"
    );
    if (product.photo.data) {
      res.set("Content-Type", product.photo.data.contentType);
      return res.send(product.photo.data);
    }
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.productId
    ).select("-photo");
    res.json(product);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;

    // Validation
    switch (true) {
      case !name.trim():
        res.json({ error: "Name is required!" });
      case !description.trim():
        res.json({ error: "Description is required!" });
      case !price.trim():
        res.json({ error: "Price is required!" });
      case !category.trim():
        res.json({ error: "Category is required!" });
      case !quantity.trim():
        res.json({ error: "Quantity is required!" });
      case !shipping.trim():
        res.json({ error: "Shipping is required!" });
      case photo && photo.size > 100000:
        res.json({ error: "Image should be less than 1mb in size!" });
    }
    // Update Products

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        ...req.fields,
        slug: slugify(name),
      },
      { new: true }
    );
    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }
    await product.save();
    res.json(product);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

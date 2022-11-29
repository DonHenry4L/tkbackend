const slugify = require("slugify");
const E_category = require("../models/E_category");
const { sendError } = require("../utils/helper");

exports.e_category = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name.trim()) {
      sendError(res, "Name is required");
    }
    const existingCategory = await E_category.findOne({ name });
    if (existingCategory) {
      return sendError(res, "Already Exists");
    }
    const category = await new E_category({ name, slug: slugify(name) }).save();
    res.json(category);
  } catch (error) {
    return sendError(res, "Error Occurred in Category Controller", 400);
  }
};

exports.updateE_category = async (req, res) => {
  try {
    const { name } = req.body;
    const { categoryId } = req.params;
    const category = await E_category.findByIdAndUpdate(
      categoryId,
      {
        name,
        slug: slugify(name),
      },
      { new: true }
    );
    res.json(category);
  } catch (error) {
    console.log(error);
    return sendError(res, error.message);
  }
};
exports.removeE_category = async (req, res) => {
  try {
    const removed = await E_category.findByIdAndDelete(req.params.categoryId);
    res.json(removed);
  } catch (error) {
    console.log(error);
    return sendError(res, error.message);
  }
};
exports.list = async (req, res) => {
  try {
    const all = await E_category.find({});
    res.json(all);
  } catch (error) {
    console.log(error);
    return sendError(res, error.message);
  }
};
exports.read = async (req, res) => {
  try {
    const category = await E_category.findOne({ slug: req.params.slug });
    res.json(category);
  } catch (error) {
    console.log(error);
    return sendError(res, error.message);
  }
};

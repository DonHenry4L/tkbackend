const { isValidObjectId } = require("mongoose");

const { sendError } = require("../utils/helper");
const Category = require("../models/category");
const slugify = require("slugify");

//create
// Only Admin can create, delete and update Category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await new Category({
      name,
      slug: slugify(name),
    }).save();
    res.json(category);
  } catch (error) {
    console.log(error);
  }
};

//fetch all
exports.categories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.log(err);
  }
  // const categories = await Category.find()
  //   .sort({ createdAt: "-1" })
  //   .populate("user");

  // if (!categories) {
  //   return sendError(res, "Not Category List!");
  // }
  // res.status(200).send(categories);
};

//fetch a single category
// exports.getCategoryById = (async (req, res) => {
//   const { categoryId } = req.params;

//   if (!isValidObjectId(categoryId)) return sendError(res, "Invalid request!");

//   const category = await Category.findById(categoryId)
//     .populate("user")
//     .sort({ createdAt: "-1" });
//   if (!category)
//     return sendError(res, "Invalid request, category not found!", 404);
//   res.json(category);
// });

//update
exports.updateCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name } = req.body;
    const category = await Category.findOneAndUpdate(
      { slug },
      { name, slug: slugify(name) },
      { new: true }
    );
    res.json(category);
  } catch (error) {
    sendError(res, "Category not found!", 404);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOneAndDelete({ slug });
    res.json(category);
  } catch (err) {
    console.log(err);
  }
};

exports.postsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });

    const posts = await Post.find({ categories: category._id })
      .populate("featuredImage postedBy")
      .limit(20);

    res.json({ posts, category });
  } catch (err) {
    console.log(err);
  }
};

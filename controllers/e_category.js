const E_category = require("../models/E_category");
const { sendError } = require("../utils/helper");

exports.newCategory = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      sendError(res, "Category is required");
    }
    const existingCategory = await E_category.findOne({ name: category });
    if (existingCategory) {
      return sendError(res, "Category already exists");
    }
    const categoryCreated = await new E_category({ name: category }).save();
    res.json(categoryCreated);
  } catch (error) {
    return sendError(res, "Error Occurred in Category Controller", 400);
  }
};

// exports.updateE_category = async (req, res) => {
//   try {
//     const { name } = req.body;
//     const { categoryId } = req.params;
//     const category = await E_category.findByIdAndUpdate(
//       categoryId,
//       {
//         name,
//         slug: slugify(name),
//       },
//       { new: true }
//     );
//     res.json(category);
//   } catch (error) {
//     console.log(error);
//     return sendError(res, error.message);
//   }
// };


exports.deleteCategory = async (req, res) => {
  try {
    if (req.params.category !== "Choose category") {
      const categoryExists = await E_category.findOne({
        name: decodeURIComponent(req.params.categoryId),
      })
      await categoryExists.remove();
      res.json({ categoryDeleted: true });
    }
  } catch (error) {
    console.log(error);
    return sendError(res, error.message);
  }
};

// try {
//   if(req.params.category !== "Choose category") {
//     const categoryExists = await E_category.findOne({
//       name: decodeURIComponent(req.params.category)
//     })
//   }
//   await categoryExists.remove()
//   res.json({categoryDeleted: true})
//   const removed = await E_category.findByIdAndDelete(req.params.categoryId);
//   res.json(removed);
// } catch (error) {
//   console.log(error);
//   return sendError(res, error.message);
// }
exports.getCategories = async (req, res) => {
  try {
    const categories = await E_category.find({}).sort({ name: "asc" });
    res.json(categories);
  } catch (error) {
    console.log(error);
    return sendError(res, error.message);
  }
};
// exports.read = async (req, res) => {
//   try {
//     const category = await E_category.findOne({ slug: req.params.slug });
//     res.json(category);
//   } catch (error) {
//     console.log(error);
//     return sendError(res, error.message);
//   }
// };

exports.saveAttributes = async (req, res) => {
  const { key, val, categoryChoosen } = req.body;
  if (!key || !val || !categoryChoosen) {
    return res.status(400).send("All inputs are required");
  }
  try {
    const category = categoryChoosen.split("/")[0];
    const categoryExists = await E_category.findOne({ name: category });
    if (categoryExists.attrs.length > 0) {
      // if key exists in the database then add a value to the key
      var keyDoesNotExistsInDatabase = true;
      categoryExists.attrs.map((item, idx) => {
        if (item.key === key) {
          keyDoesNotExistsInDatabase = false;
          var copyAttributeValues = [...categoryExists.attrs[idx].value];
          copyAttributeValues.push(val);
          var newAttributeValues = [...new Set(copyAttributeValues)]; // Set ensures unique values
          categoryExists.attrs[idx].value = newAttributeValues;
        }
      });

      if (keyDoesNotExistsInDatabase) {
        categoryExists.attrs.push({ key: key, value: [val] });
      }
    } else {
      // push to the array
      categoryExists.attrs.push({ key: key, value: [val] });
    }
    await categoryExists.save();
    let cat = await E_category.find({}).sort({ name: "asc" });
    return res.status(201).json({ categoriesUpdated: cat });
  } catch (error) {
    console.log(error);
    return sendError(res, error.message);
  }
};

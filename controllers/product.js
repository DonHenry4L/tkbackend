const Product = require("../models/product");
const recordsPerPage = require("../Config/pagination");
const fs = require("fs");
const slugify = require("slugify");
const e_imageValidate = require("../utils/e_imageValidate");
const product = require("../models/product");

// exports.createProduct = async (req, res) => {
//   try {
//     const { name, description, price, category, quantity, shipping } =
//       req.fields;
//     const { photo } = req.files;

//     // Validation
//     switch (true) {
//       case !name.trim():
//         res.json({ error: "Name is required!" });
//       case !description.trim():
//         res.json({ error: "Description is required!" });
//       case !price.trim():
//         res.json({ error: "Price is required!" });
//       case !category.trim():
//         res.json({ error: "Category is required!" });
//       case !quantity.trim():
//         res.json({ error: "Quantity is required!" });
//       case !shipping.trim():
//         res.json({ error: "Shipping is required!" });
//       case photo && photo.size > 100000:
//         res.json({ error: "Image should be less than 1mb in size!" });
//     }
//     // create Products

//     const product = new Product({ ...req.fields, slug: slugify(name) });
//     if (photo) {
//       product.photo.data = fs.readFileSync(photo.path);
//       product.photo.contentType = photo.type;
//     }
//     await product.save();
//     res.json(product);
//   } catch (error) {
//     return res.status(400).json(error.message);
//   }
// };

exports.getProducts = async (req, res) => {
  try {
    let query = {};
    let queryCondition = false;

    let priceQueryCondition = {};
    if (req.query.price) {
      queryCondition = true;
      priceQueryCondition = { price: { $lte: Number(req.query.price) } };
    }
    let ratingQueryCondition = {};
    if (req.query.rating) {
      queryCondition = true;
      ratingQueryCondition = { rating: { $in: req.query.rating.split(",") } };
    }
    let categoryQueryCondition = {};
    const categoryName = req.params.categoryName || "";
    if (categoryName) {
      queryCondition = true;
      let a = categoryName.replaceAll(",", "/");
      var regEx = new RegExp("^" + a);
      categoryQueryCondition = { category: regEx };
    }
    if (req.query.category) {
      queryCondition = true;
      let a = req.query.category.split(",").map((item) => {
        if (item) return new RegExp("^" + item);
      });
      categoryQueryCondition = {
        category: { $in: a },
      };
    }

    let attrsQueryCondition = [];
    if (req.query.attrs) {
      // attrs=RAM-1TB-2TB-4TB,color-blue-red
      // [ 'RAM-1TB-4TB', 'color-blue', '' ]
      attrsQueryCondition = req.query.attrs.split(",").reduce((acc, item) => {
        if (item) {
          let a = item.split("-");
          let values = [...a];
          values.shift(); // removes first item
          let a1 = {
            attrs: { $elemMatch: { key: a[0], value: { $in: values } } },
          };
          acc.push(a1);
          // console.dir(acc, { depth: null })
          return acc;
        } else return acc;
      }, []);
      //   console.dir(attrsQueryCondition, { depth: null });
      queryCondition = true;
    }

    //pagination
    const pageNum = Number(req.query.pageNum) || 1;

    // sort by name, price etc.
    let sort = {};
    const sortOption = req.query.sort || "";
    if (sortOption) {
      let sortOpt = sortOption.split("_");
      sort = { [sortOpt[0]]: Number(sortOpt[1]) };
    }

    const searchQuery = req.params.searchQuery || "";
    let searchQueryCondition = {};
    let select = {};
    if (searchQuery) {
      queryCondition = true;
      searchQueryCondition = { $text: { $search: searchQuery } };
      select = {
        score: { $meta: "textScore" },
      };
      sort = { score: { $meta: "textScore" } };
    }

    if (queryCondition) {
      query = {
        $and: [
          priceQueryCondition,
          ratingQueryCondition,
          categoryQueryCondition,
          searchQueryCondition,
          ...attrsQueryCondition,
        ],
      };
    }

    // if (queryCondition) {
    //   query = {
    //     $and: [
    //       priceQueryCondition,
    //       ratingQueryCondition,
    //       categoryQueryCondition,
    //     ],
    //   };
    // }

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .select(select)
      .skip(recordsPerPage * (pageNum - 1))
      .sort(sort)
      .limit(recordsPerPage);

    res.json({
      products,
      pageNum,
      paginationLinksNumber: Math.ceil(totalProducts / recordsPerPage),
    });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.getProductById = async (req, res) => {
  try {
    const products = await Product.findById(req.params.id).populate("reviews");

    res.json(products);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.getBestSellers = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sort: { category: 1, sales: -1 } },
      {
        $group: { _id: "$category", doc_with_max_sales: { $first: "$$ROOT" } },
      },
      { $replaceWith: "$doc_with_max_sales" },
      { $match: { sales: { $gt: 0 } } },
      { $project: { _id: 1, name: 1, images: 1, category: 1, description: 1 } },
      { $limit: 3 },
    ]);
    res.json(products);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.adminGetProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ category: 1 })
      .select("name price category");
    return res.json(products);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.adminDeleteProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    await product.remove();
    res.json({ message: "product successfully deleted" });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.adminCreateProduct = async (req, res) => {
  try {
    const product = new Product();
    const { name, description, count, price, category, attributesTable } =
      req.body;
    product.name = name;
    product.description = description;
    product.count = count;
    product.price = price;
    product.category = category;
    if (attributesTable.length > 0) {
      attributesTable.map((item) => {
        product.attrs.push(item);
      });
    }
    await product.save();

    res.json({
      message: "product successfully created",
      productId: product._id,
    });
    product.attributesTable = attributesTable;
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.adminUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const { name, description, price, category, attributesTable } = req.body;
    product.name = name || product.name;
    product.description = description || product.description;
    product.count = count || product.count;
    product.price = price || product.price;
    product.category = category || product.category;
    if (attributesTable.length > 0) {
      product.attrs = [];
      attributesTable.map((item) => {
        product.attrs.push(item);
      });
    } else {
      product.attrs = [];
    }
    await product.save();
    res.json({
      message: "Product successfully updated",
    });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.adminUpload = async (req, res) => {
  try {
    if (!req.files || !!req.files.images === false) {
      return res.status(400).send("No files were uploaded.");
    }
    const validateResult = e_imageValidate(req.files.images);
    if (validateResult.error) {
      return res.status(400).send(validateResult.error);
    }

    const path = require("path");
    const { v4: uuidv4 } = require("uuid");
    const uploadDirectly = path.resolve(
      __dirname,
      "../../frontend",
      "public",
      "image",
      "products"
    );

    let imagesTable = [];
    if (Array.isArray(req.files.images)) {
      imagesTable = req.files.images;
    } else {
      imagesTable.push(req.files.images);
    }
    for (let image of imagesTable) {
      var fileName = uuidv4() + path.extname(image.name);
      var uploadPath = uploadDirectly + "/" + fileName;
      product.images.push({ path: "/image/products/" + fileName });
      image.mv(uploadPath, function (err) {
        if (err) {
          sendError(res, err);
        }
      });
    }
    await product.save();

    return res.send("File upload complete!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

exports.adminDeleteProductImage = async (req, res) => {
  try {
    const imagePath = decodeURIComponent(req.params.imagePath);

    const path = require("path");
    const finalPath = path.resolve("../frontend/public") + imagePath;

    const fs = require("fs");
    fs.unlink(finalPath, (err) => {
      if (err) {
        sendError(res, err);
      }
    });
    await Product.findOneAndUpdate(
      { _id: req.params.productId },
      {
        $pull: {
          images: {
            path: imagePath,
          },
        },
      }
    );
    return res.end();
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

// exports.photo = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.productId).select(
//       "photo"
//     );
//     if (product.photo.data) {
//       res.set("Content-Type", product.photo.data.contentType);
//       return res.send(product.photo.data);
//     }
//   } catch (error) {
//     return res.status(400).json(error.message);
//   }
// };

// exports.remove = async (req, res) => {
//   try {
//     const product = await Product.findByIdAndDelete(
//       req.params.productId
//     ).select("-photo");
//     res.json(product);
//   } catch (error) {
//     return res.status(400).json(error.message);
//   }
// };

// exports.update = async (req, res) => {
//   try {
//     const { name, description, price, category, quantity, shipping } =
//       req.fields;
//     const { photo } = req.files;

//     // Validation
//     switch (true) {
//       case !name.trim():
//         res.json({ error: "Name is required!" });
//       case !description.trim():
//         res.json({ error: "Description is required!" });
//       case !price.trim():
//         res.json({ error: "Price is required!" });
//       case !category.trim():
//         res.json({ error: "Category is required!" });
//       case !quantity.trim():
//         res.json({ error: "Quantity is required!" });
//       case !shipping.trim():
//         res.json({ error: "Shipping is required!" });
//       case photo && photo.size > 100000:
//         res.json({ error: "Image should be less than 1mb in size!" });
//     }
//     // Update Products

//     const product = await Product.findByIdAndUpdate(
//       req.params.productId,
//       {
//         ...req.fields,
//         slug: slugify(name),
//       },
//       { new: true }
//     );
//     if (photo) {
//       product.photo.data = fs.readFileSync(photo.path);
//       product.photo.contentType = photo.type;
//     }
//     await product.save();
//     res.json(product);
//   } catch (error) {
//     return res.status(400).json(error.message);
//   }
// };

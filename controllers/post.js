const cloudinary = require("../cloud");
const Post = require("../models/post");
const slugify = require("slugify");
const Media = require("../models/media");
const User = require("../models/user");
const Category = require("../models/category");
const Comment = require("../models/comment");
const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;

exports.uploadImage = async (req, res) => {
  // try {
  //   // console.log(req.files);
  //   const result = await cloudinary.uploader.upload(req.body.picture);
  //   // save to db
  //   const media = await new Media({
  //     url: result.secure_url,
  //     public_id: result.public_id,
  //     postedBy: req.user._id,
  //   }).save();
  //   res.json(media);
  // } catch (err) {
  //   console.log(err);
  // }
  try {
    // console.log(req.body);
    const result = await cloudinary.uploader.upload(req.body.image);
    // console.log(result);
    res.json(result.secure_url);
  } catch (err) {
    console.log(err);
  }
};

exports.uploadImageFile = async (req, res) => {
  try {
    // console.log(req.files);
    const result = await cloudinary.uploader.upload(req.files.file.path);
    // save to db
    const media = await new Media({
      url: result.secure_url,
      public_id: result.public_id,
      postedBy: req.user._id,
    }).save();
    res.json(media);
  } catch (err) {
    console.log(err);
  }
};

exports.createPost = async (req, res) => {
  try {
    // console.log(req.body);
    const { file, body } = req;
    const { title, content, categories } = body;
    const userId = req.user._id;
    // check if title is taken
    const alreadyExist = await Post.findOne({
      slug: slugify(title.toLowerCase()),
    });
    if (alreadyExist) return res.json({ error: "Title is taken" });

    // get category ids based on category name
    let ids = [];
    for (let i = 0; i < categories.length; i++) {
      Category.findOne({
        name: categories[i],
      }).exec((err, data) => {
        if (err) return console.log(err);
        ids.push(data._id);
      });
    }

    // save post
    setTimeout(async () => {
      try {
        const post = await new Post({
          ...req.body,
          slug: slugify(title),
          categories: ids,
          postedBy: userId,
        });

        await post.save();

        // push the post _id to user's posts []
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { posts: post._id },
        });

        res.status(201).json({
          post: {
            id: post._id,
            title,
          },
        });
      } catch (err) {
        console.log(err);
      }
    }, 1000);
  } catch (err) {
    console.log(err);
  }
};

exports.posts = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page || 1;

    const all = await Post.find()
      .skip((page - 1) * perPage)
      .populate("featuredImage")
      .populate("postedBy", "username")
      .populate("categories", "name slug")
      .sort({ createdAt: -1 })
      .limit(perPage);
    res.json(all);
  } catch (err) {
    console.log(err);
  }
};

exports.singlePost = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug })
      .populate("postedBy", "username")
      .populate("categories", "name slug")
      .populate("featuredImage", "url");
    // comments
    const comments = await Comment.find({ postId: post._id })
      .populate("postedBy", "username")
      .sort({ createdAt: -1 });

    console.log("__comments__", comments);

    res.json({ post, comments });
  } catch (err) {
    console.log(err);
  }
};

exports.removePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, featuredImage, categories } = req.body;
    // get category ids based on category name
    let ids = [];
    for (let i = 0; i < categories.length; i++) {
      Category.findOne({
        name: categories[i],
      }).exec((err, data) => {
        if (err) return console.log(err);
        ids.push(data._id);
      });
    }

    setTimeout(async () => {
      const post = await Post.findByIdAndUpdate(
        postId,
        {
          title,
          slug: slugify(title),
          content,
          categories: ids,
          featuredImage,
        },
        { new: true }
      )
        .populate("postedBy", "username")
        .populate("categories", "name slug")
        .populate("featuredImage", "url");

      res.json(post);
    }, 1000);
  } catch (err) {
    console.log(err);
  }
};

exports.postCount = async (req, res) => {
  try {
    const count = await Post.countDocuments();
    res.json(count);
  } catch (err) {
    console.log(err);
  }
};

// Media
exports.media = async (req, res) => {
  try {
    const media = await Media.find()
      .populate("postedBy", "_id")
      .sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    console.log(err);
  }
};

exports.removeMedia = async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

exports.postsForAdmin = async (req, res) => {
  try {
    const posts = await Post.find().select("title slug");
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.postsByAuthor = async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.user._id })
      .populate("postedBy", "username")
      .populate("categories", "name slug")
      .populate("featuredImage", "url")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    let newComment = await new Comment({
      content: comment,
      postedBy: req.user._id,
      postId,
    }).save();
    newComment = await newComment.populate("postedBy", "username");
    res.json(newComment);
  } catch (err) {
    console.log(err);
  }
};

exports.comments = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page || 1;

    const allComments = await Comment.find()
      .skip((page - 1) * perPage)
      .populate("postedBy", "username")
      .populate("postId", "title slug")
      .sort({ createdAt: -1 })
      .limit(perPage);

    return res.json(allComments);
  } catch (err) {
    console.log(err);
  }
};

exports.userComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postedBy: req.user._id })
      .populate("postedBy", "username")
      .populate("postId", "title slug")
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (err) {
    console.log(err);
  }
};

exports.commentCount = async (req, res) => {
  try {
    const count = await Comment.countDocuments();
    res.json(count);
  } catch (err) {
    console.log(err);
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    );
    res.json(updatedComment);
  } catch (err) {
    console.log(err);
  }
};

exports.removeComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

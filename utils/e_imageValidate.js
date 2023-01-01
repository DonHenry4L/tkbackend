const { sendError } = require("./helper");

const e_imageValidate = (images) => {
  let imageTable = [];
  if (Array.isArray(images)) {
    imageTable = images;
  } else {
    imageTable.push(images);
  }
  if (imageTable.length > 3) {
    return { error: "Send only 3 images at once" };
  }
  for (let image of imageTable) {
    if (image.size > 1048576)
      return sendError(res, "Size too large (above 1 MB");
    const filetypes = /jpg|jpeg|png/;
    const mimetype = filetypes.test(image.mimetype);
    if (!mimetype)
      return sendError(res, "Invalid file type (should be .jpg, .jpeg, .png");
  }
  return { error: false };
};

module.exports = e_imageValidate;

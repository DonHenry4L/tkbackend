exports.sendError = (res, error, statusCode = 401) => {
  res.status(statusCode).json({ error });
};

exports.handleNotFound = (req, res) => {
  this.sendError(res, "Not found", 404);
};

exports.generateRandomByte = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buff) => {
      if (err) reject(err);
      const buffString = buff.toString("hex");

      resolve(buffString);
    });
  });
};

// Create User By Admin
exports.hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

exports.comparePassword = (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

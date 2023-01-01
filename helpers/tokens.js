const jwt = require("jsonwebtoken");

// exports.generateToken = (payload, expired) => {
//   return jwt.sign(payload, process.env.JWT_SECRET, {
//     expiresIn: expired,
//   });
// };
exports.generateToken = (_id, first_name, last_name, email, isAdmin, role) => {
  return jwt.sign(
    { _id, first_name, last_name, email, isAdmin, role },
    process.env.JWT_SECRET,
    { expiresIn: "7h" }
  );
};

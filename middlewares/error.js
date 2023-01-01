exports.errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    res.status(500).json({ error: err.message || err });
  } else {
    res.status(500).json({
      message: error.message,
    });
  }
};

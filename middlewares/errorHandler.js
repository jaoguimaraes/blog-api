const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (error.name === "SequelizeValidationError") {
    const errors = error.errors.map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Unique constraint failed",
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "JSON invalid requisition",
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
};

module.exports = errorHandler;
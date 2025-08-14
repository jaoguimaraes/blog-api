const validatePostData = (req, res, next) => {
  const { title, content } = req.body;
  const errors = [];

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    errors.push("Title must be at least 3 characters long");
  }

  if (title && title.length > 200) {
    errors.push("Title must be less than 200 characters long");
  }

  if (!content || typeof content !== "string" || content.trim().length < 10) {
    errors.push("Content must be at least 10 characters long");
  }

  if (content && content.length > 50000) {
    errors.push("Content must be less than 50000 characters long");
  }

  if (title && title.trim().toLowerCase().includes("spam")) {
    errors.push("Title contains illegal content");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  req.body.title = title.trim();
  req.body.content = content.trim();

  next();
};

const validateRegisterData = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!email || !email.includes("@")) {
    errors.push("Email must be valid");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors,
    });
  }

  next();
};

const validateLoginData = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  next();
};

const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
    });
  }

  req.params.id = id;
  next();
};

module.exports = {
  validatePostData,
  validateRegisterData,
  validateLoginData,
  validateId,
};

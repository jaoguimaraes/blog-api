const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/auth");
const {
  validateRegisterData,
  validateLoginData,
} = require("../middlewares/validation");

router.post("/register", validateRegisterData, authController.register);
router.post("/login", validateLoginData, authController.login);

router.get("/me", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);

module.exports = router;

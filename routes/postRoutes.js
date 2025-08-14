const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { authenticate, optionalAuth } = require("../middlewares/auth");
const { validatePostData, validateId } = require("../middlewares/validation");

router.get("/", optionalAuth, postController.getAllPosts);
router.get("/stats", postController.getStats);
router.get("/:id", validateId, optionalAuth, postController.getPostById);

router.post("/", authenticate, validatePostData, postController.createPost);
router.put(
  "/:id",
  validateId,
  authenticate,
  validatePostData,
  postController.updatePost
);
router.delete("/:id", validateId, authenticate, postController.deletePost);

module.exports = router;

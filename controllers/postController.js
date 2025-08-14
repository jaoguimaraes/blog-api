const { Op } = require("sequelize");
const Post = require("../models/Post");
const User = require("../models/User");

const postController = {
  getAllPosts: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        author,
        published,
        search,
        sortBy = "created_at",
        order = "DESC",
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit), 50);

      if (pageNum < 1 || limitNum < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid page or limit",
        });
      }

      let whereClause = {};

      if (author) {
        whereClause.author = { [Op.iLike]: `%${author}%` };
      }

      if (published !== undefined) {
        whereClause.published = published === "true";
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (!req.user || req.user.role !== "admin") {
        whereClause.published = true;
      }

      const { count, rows: posts } = await Post.findAndCountAll({
        where: whereClause,
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
        order: [[sortBy, order.toUpperCase()]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      res.json({
        success: true,
        data: posts,
        pagination: {
          currentPage: pageNum,
          totalPage: Math.ceil(count / limitNum),
          totalItems: count,
          itemsPerPage: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getPostById: async (req, res, next) => {
    try {
      const postId = req.params.id;

      const post = await Post.findByPk(postId, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (
        !post.published &&
        (!req.user ||
          (post.userId !== req.user.id && req.user.role !== "admin"))
      ) {
        return res.status(403).json({
          success: false,
          message: "Post is not published",
        });
      }

      if (post.published) {
        await post.incrementViews();
      }

      res.json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  },

  createPost: async (req, res, next) => {
    try {
      const { title, content, published = false } = req.body;

      const newPost = await Post.create({
        title,
        content,
        author: req.user.name,
        userId: req.user.id,
        published: Boolean(published),
      });

      res.status(201).json({
        success: true,
        message: "Post created is successfully",
        data: newPost,
      });
    } catch (error) {
      next(error);
    }
  },

  updatePost: async (req, res, next) => {
    try {
      const postId = req.params.id;
      const post = await Post.findByPk(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (post.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this post",
        });
      }

      const { title, content, published } = req.body;
      const updateData = { title, content };

      if (published !== undefined) {
        updateData.published = Boolean(published);
      }

      await post.update(updateData);

      res.json({
        success: true,
        message: "Post updated successfully",
        data: post,
      });
    } catch (error) {
      next(error);
    }
  },

  deletePost: async (req, res, next) => {
    try {
      const postId = req.params.id;
      const post = await Post.findByPk(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (post.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this post",
        });
      }

      const postData = {
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author,
      };

      await post.destroy();

      res.json({
        success: true,
        message: "Post deleted successfully",
        data: postData,
      });
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const totalPosts = await Post.count();
      const publishedPosts = await Post.count({ where: { published: true } });
      const totalViews = (await Post.sum("views")) || 0;

      const topAuthor = await Post.findAll({
        attributes: [
          "author",
          [Post.sequelize.fn("COUNT", Post.sequelize.col("id")), "post_count"],
          [
            Post.sequelize.fn("SUM", Post.sequelize.col("views")),
            "total_views",
          ],
        ],
        group: ["author"],
        order: [[Post.sequelize.literal("post_count"), "DESC"]],
        limit: 5,
      });

      res.json({
        success: true,
        data: {
          totalPosts,
          publishedPosts,
          totalViews,
          topAuthor,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = postController;

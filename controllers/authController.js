const User = require("../models/User");

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      const token = newUser.generateJWT();

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isPasswordValid = await user.checkPassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      await user.updateLastLogin();
      const token = user.generateJWT();

      res.json({
        success: true,
        message: "User logged in successfully",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getProfile: async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          lastLogin: req.user.lastLogin,
          isActive: req.user.isActive,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const { name, email } = req.body;

      if (!name && !email) {
        return res.status(400).json({
          success: false,
          message: "Please provide at least one field to update",
        });
      }

      const updateDate = {};
      if (name) updateDate.name = name.trim();
      if (email) updateDate.email = email.toLowerCase().trim();

      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({
          where: { email: updateDate.email },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
      }

      await req.user.update(updateDate);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;

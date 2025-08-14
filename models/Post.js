const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Post extends Model {
  async incrementViews() {
    this.views++;
    await this.save();
  }

  canBeEditedBy(user) {
    return this.userId === user.id || user.role === "admin";
  }

  toPublicJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      author: this.author,
      published: this.published,
      views: this.views,
      userId: this.userId,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
    };
  }
}

Post.init(
  {
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Title not empty",
        },
        len: {
          args: [3, 200],
          msg: "Title must be between 3 and 200 characters",
        },
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Content not empty",
        },
        len: {
          args: [10, 50000],
          msg: "Content must be between 10 and 50000 characters",
        },
      },
    },
    author: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Author not empty",
        },
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      validate: {
        notEmpty: {
          msg: "User ID not empty",
        },
      },
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Views must be greater than or equal to 0",
        },
      },
    },
  },
  {
    sequelize,
    modelName: "Post",
    tableName: "posts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Post;

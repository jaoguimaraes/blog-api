const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Post extends Model {
  async incrementViews() {
    this.views++;
    await this.save();
  }
}

Post.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "post",
    tableName: "posts",
    timestamp: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Post;

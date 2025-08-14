const User = require("./User");
const Post = require("./Post");

User.hasMany(Post, {
  foreignKey: "userId",
  as: "posts",
  onDelete: "CASCADE",
});

Post.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

console.log("Relationship models configured");

module.exports = {
  User,
  Post,
};

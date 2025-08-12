const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Nome não pode ser vazio",
        },
        len: {
          args: [2, 100],
          msg: "Nome deve ter entre 2 e 100 caracteres",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Email deve ter formato válido",
        },
        notEmpty: {
          msg: "Email não pode ser vazio",
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: "Senha deve ter pelo menos 6 caracteres",
        },
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ["password"] },
      },
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

User.prototype.checkPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateJWT = function () {
  const payload = {
    id: this.id,
    email: this.email,
    name: this.name,
    role: this.role,
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2FvQGVtYWlsLmNvbSIsIm5hbWUiOiJKb8OjbyBTaWx2YSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDk1OTIwMiwiZXhwIjoxNzU1NTY0MDAyLCJpc3MiOiJibG9nLWFwaSJ9.QteCyKVJ3-4ZaPAoEd_6CSTAnKV78lJwfe0y_1326po",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      issuer: "blog-api",
    }
  );
};

User.prototype.updateLastLogin = function () {
  return this.update({ lastLogin: new Date() });
};

User.findByEmail = function (email) {
  return this.scope("withPassword").findOne({
    where: { email: email.toLowerCase() },
  });
};

User.findActive = function () {
  return this.findAll({
    where: { isActive: true },
    order: [["created_at", "DESC"]],
  });
};

module.exports = User;

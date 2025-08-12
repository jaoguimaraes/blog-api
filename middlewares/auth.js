const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).send({
        success: false,
        message: "Token de acesso requerido",
      });
    }
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acesso malformado",
      });
    }
    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY ||
        "8a39a74e896beb908b5e9c46ef129e678ec8dc3aa847944de32259dff322d99c25f8b70f9b19ae372274a1b75eb527291c13b09dde60c0eb809efd372c95b24c"
    );

    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Usário não encontrado ou inativo",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.message === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token de acesso inválido",
      });
    }

    console.error("Erro na autenticação: ", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Usuário não autenticado",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado. Requer privilégios de administrador",
    });
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "8a39a74e896beb908b5e9c46ef129e678ec8dc3aa847944de32259dff322d99c25f8b70f9b19ae372274a1b75eb527291c13b09dde60c0eb809efd372c95b24c"
    );

    const user = await User.findByPk(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth,
};

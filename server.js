"GET /auth/register", "POST /auth/login", "GET /auth/me", "PUT /auth/profile";
require("dotenv").config();

const express = require("express");
const { testConnection, syncDatabase } = require("./config/database");
const Post = require("./models/Post");
const User = require("./models/User");
const {
  authenticate,
  requireAdmin,
  optionalAuth,
} = require("./middlewares/auth");

const app = express();
const PORT = process.env.PORT || 3000;

//middleware (interpretador de json para js)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

const validatePostData = async (req, res, next) => {
  try {
    const { title, content, author } = req.body;

    const errors = [];

    if (!title || title.trim().length < 3) {
      errors.push("Título deve ter pelo menos 3 caracteres");
    }

    if (!content || content.trim().length < 10) {
      errors.push("Conteúdo deve ter pelo menos 10 caracteres");
    }

    if (!author || author.trim().length < 2) {
      errors.push("Autor deve ter pelo menos 2 caracteres");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: errors,
      });
    }

    const tempPost = Post.build({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
    });

    await tempPost.validate();

    req.body.title = title.trim();
    req.body.content = content.trim();
    req.body.author = author.trim();

    next();
  } catch (error) {
    if (error.nome === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: errors,
      });
    }
    next(error);
  }
};

app.post("/auth/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e senha são obrigatórios",
      });
    }

    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email já cadastrado",
      });
    }

    //criar usuário
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = newUser.generateJWT();

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
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
});

//login do usuário
app.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      });
    }

    const user = await User.findByEmail(email);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha inválidos",
      });
    }

    //verificar senha
    const isPasswordValid = await user.checkPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha inválidos",
      });
    }

    await user.updateLastLogin();
    const token = user.generateJWT();

    res.json({
      success: true,
      message: "Login realizado com sucesso",
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
});

app.get("/auth/me", authenticate, async (req, res, next) => {
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
});

app.put("/auth/profile", authenticate, async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: "Por favor, forneça o nome e o e-mail",
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({
        where: { email: updateData.email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "E-mail já cadastrado",
        });
      }
    }

    await req.user.update(updateData);

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
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
});

//GET /posts - Listar todos os posts
app.get("/posts", async (req, res, next) => {
  try {
    const { author, published } = req.query;

    let whereClause = {};

    const posts = await Post.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      attributes: { exclude: ["updated_at"] },
    });

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    next(error);
  }
});

//GET /posts/:id - Buscar um post específico
app.get("/posts/:id", async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post não encotrado",
      });
    }

    await post.incrementViews();

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

//Criar um novo post
app.post("/posts", authenticate, validatePostData, async (req, res, next) => {
  try {
    const { title, content, author } = req.body;

    const newPost = await Post.create({
      title,
      content,
      author,
    });

    res.status(201).json({
      success: true,
      message: "Post criado com sucesso!",
      data: newPost,
    });
  } catch (error) {
    next(error);
  }
});

//PUT /posts/:id - Atualizar um post
app.put(
  "/posts/:id",
  authenticate,
  validatePostData,
  async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);

      if (isNaN(postId)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      const post = await Post.findByPk(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado",
        });
      }

      const { title, content, author } = req.body;

      await post.update({
        title,
        content,
        author: author || post.author,
      });

      res.json({
        success: true,
        message: "Post atualizado com sucesso!",
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }
);

//DELETE /posts/:id - Deletar um post
app.delete("/posts/:id", authenticate, async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post não encontrado",
      });
    }

    const postData = post.toJSON(); //para salvar os dados antes de deletar
    await post.destroy();

    res.json({
      success: true,
      message: "Post deletado com sucesso!",
      data: postData,
    });
  } catch (error) {
    next(error);
  }
});

//Estatísticas do blog
app.get("/stats", async (req, res, next) => {
  try {
    const totalPosts = await Post.count();
    const publishedPosts = await Post.count({ where: { published: true } });
    const totalViews = (await Post.sum("views")) || 0;

    const topAuthors = await Post.findAll({
      attributes: [
        "author",
        [Post.sequelize.fn("COUNT", Post.sequelize.col("id")), "post_count"],
        [Post.sequelize.fn("SUM", Post.sequelize.col("views")), "total_views"],
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
        topAuthors,
      },
    });
  } catch (error) {
    next(error);
  }
});

//Rota de health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API do Blog funcionando!",
    timestamp: new Date().toISOString(),
    database: "postgreSQL conectado",
  });
});

app.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    availableaRoutes: [
      "GET /health",
      "GET /posts",
      "GET /posts/:id",
      "POST /posts",
      "PUT /posts/:id",
      "DELETE /posts/:id",
      "GET /stats",
    ],
  });
});

app.use((error, req, res, next) => {
  console.error("Erro capturado:", error);

  if (error.name === "SequelizeValidationError") {
    const erros = error.errors.map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: erros,
    });
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Violação de integridade referencial",
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "JSON inválido na requisição",
    });
  }

  res.status(500).json({
    success: false,
    message: "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
});

//Iniciar o servidor
const starterServer = async () => {
  try {
    await testConnection();
    await syncDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor iniciado na porta ${PORT}`);
      console.log(`Acesse: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Posts: http://localhost:${PORT}/posts`);
      console.log(`Stats: http://localhost:${PORT}/stats`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

starterServer();

module.exports = app;

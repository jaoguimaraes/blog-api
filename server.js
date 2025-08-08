const express = require("express");
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
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
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

const validatePostData = (req, res, next) => {
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

  req.body.title = title.trim();
  req.body.content = content.trim();
  req.body.author = author.trim();

  next();
};

let posts = [
  {
    id: 1,
    title: "Primeiro Post",
    content: "Este é o conteúdo do primeiro post",
    author: "João",
    cratedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Segundo Post",
    content: "Este é o conteúdo do segundo post",
    author: "Maria",
    cratedAt: new Date().toISOString(),
  },
];

//GET /posts - Listar todos os posts
app.get("/posts", (req, res) => {
  res.json({
    success: true,
    data: posts,
    count: posts.length,
  });
});

//GET /posts/:id - Buscar um post específico
app.get("/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post não encotrado",
    });
  }
  res.json({
    success: true,
    data: post,
  });
});

app.post("/posts", validatePostData, (req, res, next) => {
  try {
    const { title, content, author } = req.body;

    const newPost = {
      id: posts.length + 1,
      title,
      content,
      author,
      cratedAt: new Date().toISOString(),
    };
    posts.push(newPost);

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
app.put("/posts/:id", validatePostData, (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex((p) => p.id === postId);

    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Post não encontrado",
      });
    }

    next();

    const { title, content } = req.body;

    posts[postIndex].title = title;
    posts[postIndex].content = content;
    posts[postIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Post atualizado com sucesso!",
      data: posts[postIndex],
    });
  } catch (error) {
    next(error);
  }
});

//DELETE /posts/:id - Deletar um post
app.delete("/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Post não encontrado",
    });
  }

  const deletedPost = posts.splice(postIndex, 1)[0];

  res.json({
    success: true,
    message: "Post deletado com sucesso!",
    data: deletedPost,
  });
});

//Rota de health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API do Blog funcionando!",
    timestamp: new Date().toISOString(),
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
    ],
  });
});

app.use((error, req, res, next) => {
  console.error("Erro capturado:", error);

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
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Posts: http://localhost:${PORT}/posts`);
});

module.exports = app;

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

//middleware (interpretador de json para js)
app.use(express.json());

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

app.post("/posts", (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({
      success: false,
      message: "Todos os campos são obrigatórios",
    });
  }

  const newPost = {
    id: posts.length + 1,
    title,
    content,
    author,
    createdAt: new Date().toISOString(),
  };

  posts.push(newPost);

  res.status(201).json({
    success: true,
    message: "Post criado com sucesso!",
    data: newPost,
  });
});

//PUT /posts/:id - Atualizar um post
app.put("/posts/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Post não encontrado",
    });
  }
  const { title, content } = req.body;

  if (title) posts[postIndex].title = title;
  if (content) posts[postIndex].content = content;
  posts[postIndex].updateAt = new Date().toISOString();

  res.json({
    success: true,
    message: "Post atualizado com sucesso!",
    data: posts[postIndex],
  });
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

//Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
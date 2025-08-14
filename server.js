require("dotenv").config();
const express = require("express");
const { testConnection, syncDatabase } = require("./config/database");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const corsConfig = require("./config/cors");

require("./models/associations");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(corsConfig);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log("conecting to database");
    await testConnection();

    //console.log("syncronizing models");
    await syncDatabase();

    app.listen(PORT, () => {
      console.log("================================");
      console.log("server starting successffuly");
      console.log("URL:", `http://localhost:${PORT}`);
      console.log("Health:", `http://localhost:${PORT}/health`);
      console.log("Posts:", `http://localhost:${PORT}/posts`);
      console.log("Auth:", `http://localhost:${PORT}/auth`);
      console.log("================================ ");
    });
  } catch (error) {
    console.error("Error to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

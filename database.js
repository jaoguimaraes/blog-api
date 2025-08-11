const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "blog_api",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Jaaonzin@3006",

  logging: console.log, // mostar as queries SQL

  define: {
    //configurações padrões para tudo
    timestamps: true, //created_at e update_at automaticos
    underscored: true, //usar snake_case para nomes de colunas
  },

  pool: {
    max: 5, //max conections
    min: 0, //min conection
    acquire: 30000, //tempo máximo de conexão
    idle: 10000, //tempo máximo de inatividade
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Banco de dados sincronizado com sucesso!");
  } catch (error) {
    console.error("Erro ao sincronizar o banco de dados:", error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};

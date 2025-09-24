// Importa as bibliotecas necessárias
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// Configura o aplicativo Express
const app = express();
const port = 3000;

// Middleware: processa JSON e permite que o front-end se comunique com o servidor
app.use(express.json());
app.use(cors());

// Configurações do seu banco de dados MySQL
// IMPORTANTE: Preencha com suas credenciais
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'P@ssword2018', // Sua senha do MySQL
    database: 'vendas_db'
};

// --- Função para inicializar o banco de dados e as tabelas ---
const initializeDatabase = async () => {
    let connection;
    try {
        // Conecta ao servidor MySQL (sem um banco de dados específico)
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // Cria o banco de dados se ele não existir
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Banco de dados '${dbConfig.database}' verificado/criado com sucesso.`);
        connection.end(); // Fecha a conexão inicial

        // Reconecta ao banco de dados específico, permitindo múltiplas queries
        connection = await mysql.createConnection({
            ...dbConfig,
            multipleStatements: true // Essencial para executar múltiplos comandos SQL
        });

        // Comandos SQL para criar as tabelas
        const createTablesSql = `
            CREATE TABLE IF NOT EXISTS produtos (
                id_produto INT AUTO_INCREMENT PRIMARY KEY,
                nome_produto VARCHAR(255) NOT NULL,
                descricao TEXT,
                preco_unitario DECIMAL(10, 2) NOT NULL,
                data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS vendas (
                id_venda INT AUTO_INCREMENT PRIMARY KEY,
                data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_venda DECIMAL(10, 2) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS itens_venda (
                id_item_venda INT AUTO_INCREMENT PRIMARY KEY,
                id_venda INT NOT NULL,
                id_produto INT NOT NULL,
                quantidade INT NOT NULL,
                preco_unitario_no_momento DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (id_venda) REFERENCES vendas(id_venda),
                FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
            );
        `;

        await connection.query(createTablesSql);
        console.log('Tabelas verificadas/criadas com sucesso.');

    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
        process.exit(1); // Sai do processo se houver um erro
    } finally {
        if (connection) connection.end(); // Garante que a conexão seja fechada
    }
};

// --- API Endpoints (os "caminhos" que o seu front-end irá chamar) ---

// Endpoint para obter todos os produtos
app.get('/api/produtos', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM produtos ORDER BY id_produto DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter os produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    } finally {
        if (connection) connection.end();
    }
});

// Endpoint para cadastrar um novo produto
app.post('/api/produtos', async (req, res) => {
    const { nome, preco, descricao } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `INSERT INTO produtos (nome_produto, preco_unitario, descricao) VALUES (?, ?, ?)`;
        const [result] = await connection.query(sql, [nome, preco, descricao]);
        res.status(201).json({ id: result.insertId, message: 'Produto cadastrado com sucesso.' });
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        res.status(500).json({ error: 'Erro ao cadastrar o produto.' });
    } finally {
        if (connection) connection.end();
    }
});

// --- Inicia o Servidor ---
const startServer = async () => {
    // Inicializa o banco de dados antes de iniciar o servidor
    await initializeDatabase();
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
};

// Chama a função que inicia o servidor
startServer();
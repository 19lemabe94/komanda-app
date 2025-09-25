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
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'P@ssword2018', // Sua senha do MySQL
    database: 'vendas_db'
};

// --- Função para normalizar strings (NOVO) ---
function normalizeString(str) {
    if (!str) return null;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// --- Função para inicializar o banco de dados e as tabelas ---
const initializeDatabase = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Banco de dados '${dbConfig.database}' verificado/criado com sucesso.`);
        connection.end();

        connection = await mysql.createConnection({
            ...dbConfig,
            multipleStatements: true
        });

        // --- Código SQL para criar as tabelas ---
        const createTablesSql = `
            CREATE TABLE IF NOT EXISTS categorias (
                id_categoria INT AUTO_INCREMENT PRIMARY KEY,
                nome_categoria VARCHAR(255) NOT NULL UNIQUE
            );
            
            CREATE TABLE IF NOT EXISTS produtos (
                id_produto INT AUTO_INCREMENT PRIMARY KEY,
                nome_produto VARCHAR(255) NOT NULL,
                descricao TEXT,
                preco_unitario DECIMAL(10, 2) NOT NULL,
                data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
                id_categoria INT,
                FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
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
        process.exit(1);
    } finally {
        if (connection) connection.end();
    }
};

// --- API Endpoints para CATEGORIAS ---

// READ: Endpoint para obter todas as categorias
app.get('/api/categorias', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM categorias ORDER BY nome_categoria ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter as categorias:', error);
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    } finally {
        if (connection) connection.end();
    }
});

// CREATE: Endpoint para cadastrar uma nova categoria
app.post('/api/categorias', async (req, res) => {
    let { nome } = req.body;
    let connection;
    try {
        if (!nome) {
            return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        }
        nome = normalizeString(nome);
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.query('INSERT INTO categorias (nome_categoria) VALUES (?)', [nome]);
        res.status(201).json({ id: result.insertId, message: 'Categoria cadastrada com sucesso.' });
    } catch (error) {
        console.error('Erro ao cadastrar categoria:', error);
        res.status(500).json({ error: 'Erro ao cadastrar a categoria.' });
    } finally {
        if (connection) connection.end();
    }
});

// DELETE: Endpoint para excluir uma categoria
app.delete('/api/categorias/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `DELETE FROM categorias WHERE id_categoria = ?`;
        const [result] = await connection.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            res.status(409).json({ error: 'Não é possível excluir esta categoria porque há produtos associados a ela.' });
        } else {
            res.status(500).json({ error: 'Erro ao excluir a categoria.' });
        }
    } finally {
        if (connection) connection.end();
    }
});

// --- API Endpoints para PRODUTOS ---

// CREATE: Endpoint para cadastrar um novo produto
app.post('/api/produtos', async (req, res) => {
    let { nome, preco, descricao, id_categoria } = req.body;
    let connection;
    try {
        nome = normalizeString(nome);
        descricao = normalizeString(descricao);
        connection = await mysql.createConnection(dbConfig);
        const sql = `INSERT INTO produtos (nome_produto, preco_unitario, descricao, id_categoria) VALUES (?, ?, ?, ?)`;
        const [result] = await connection.query(sql, [nome, preco, descricao, id_categoria]);
        res.status(201).json({ id: result.insertId, message: 'Produto cadastrado com sucesso.' });
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        res.status(500).json({ error: 'Erro ao cadastrar o produto.' });
    } finally {
        if (connection) connection.end();
    }
});

// READ: Endpoint para obter todos os produtos
app.get('/api/produtos', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT 
                p.id_produto, 
                p.nome_produto, 
                p.descricao, 
                p.preco_unitario,
                p.id_categoria,
                c.nome_categoria
            FROM produtos AS p
            LEFT JOIN categorias AS c
            ON p.id_categoria = c.id_categoria
            ORDER BY p.id_produto DESC
        `;
        const [rows] = await connection.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter os produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    } finally {
        if (connection) connection.end();
    }
});

// UPDATE: Endpoint para atualizar um produto
app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    let { nome, preco, descricao, id_categoria } = req.body;
    let connection;
    try {
        nome = normalizeString(nome);
        descricao = normalizeString(descricao);
        connection = await mysql.createConnection(dbConfig);
        const sql = `UPDATE produtos SET nome_produto = ?, preco_unitario = ?, descricao = ?, id_categoria = ? WHERE id_produto = ?`;
        const [result] = await connection.query(sql, [nome, preco, descricao, id_categoria, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json({ message: 'Produto atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar o produto.' });
    } finally {
        if (connection) connection.end();
    }
});

// DELETE: Endpoint para excluir um produto
app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `DELETE FROM produtos WHERE id_produto = ?`;
        const [result] = await connection.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json({ message: 'Produto excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ error: 'Erro ao excluir o produto.' });
    } finally {
        if (connection) connection.end();
    }
});

// --- Inicia o Servidor ---
const startServer = async () => {
    await initializeDatabase();
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
};

startServer();
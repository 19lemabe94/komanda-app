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

// --- Função para normalizar strings ---
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
                numero_mesa INT NOT NULL,
                status_venda VARCHAR(255) NOT NULL,
                data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_fechamento DATETIME,
                total_venda DECIMAL(10, 2) DEFAULT 0.00,
                metodo_pagamento VARCHAR(255)
            );
            
            CREATE TABLE IF NOT EXISTS itens_venda (
                id_item_venda INT AUTO_INCREMENT PRIMARY KEY,
                id_venda INT NOT NULL,
                id_produto INT NOT NULL,
                quantidade INT NOT NULL,
                preco_unitario_no_momento DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (id_venda) REFERENCES vendas(id_venda) ON DELETE CASCADE,
                FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE
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

// --- API Endpoints para VENDAS ---
app.get('/api/vendas/abertas', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT 
                v.id_venda,
                v.numero_mesa,
                v.total_venda,
                v.data_abertura,
                COUNT(iv.id_item_venda) AS total_itens
            FROM vendas AS v
            LEFT JOIN itens_venda AS iv ON v.id_venda = iv.id_venda
            WHERE v.status_venda = 'aberta'
            GROUP BY v.id_venda, v.numero_mesa, v.total_venda, v.data_abertura
            ORDER BY v.numero_mesa ASC
        `;
        const [rows] = await connection.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar vendas abertas:', error);
        res.status(500).json({ error: 'Erro ao buscar vendas.' });
    } finally {
        if (connection) connection.end();
    }
});

app.post('/api/vendas/abrir', async (req, res) => {
    const { numero_mesa } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [existing] = await connection.query(`SELECT * FROM vendas WHERE numero_mesa = ? AND status_venda = 'aberta'`, [numero_mesa]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Já existe uma comanda aberta para esta mesa.' });
        }
        const sql = `INSERT INTO vendas (numero_mesa, status_venda) VALUES (?, 'aberta')`;
        const [result] = await connection.query(sql, [numero_mesa]);
        res.status(201).json({ id: result.insertId, message: 'Comanda aberta com sucesso.' });
    } catch (error) {
        console.error('Erro ao abrir comanda:', error);
        res.status(500).json({ error: 'Erro ao abrir a comanda.' });
    } finally {
        if (connection) connection.end();
    }
});

app.get('/api/vendas/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT 
                iv.id_item_venda, 
                iv.quantidade, 
                iv.preco_unitario_no_momento,
                p.nome_produto
            FROM itens_venda AS iv
            JOIN produtos AS p ON iv.id_produto = p.id_produto
            WHERE iv.id_venda = ?
        `;
        const [items] = await connection.query(sql, [id]);
        
        const [total] = await connection.query(`SELECT total_venda FROM vendas WHERE id_venda = ?`, [id]);

        res.json({
            items: items,
            total: total[0].total_venda
        });
    } catch (error) {
        console.error('Erro ao obter detalhes da venda:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes da venda.' });
    } finally {
        if (connection) connection.end();
    }
});

app.post('/api/vendas/:id/item', async (req, res) => {
    const { id } = req.params;
    const { id_produto, quantidade } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [product] = await connection.query(`SELECT preco_unitario FROM produtos WHERE id_produto = ?`, [id_produto]);
        if (product.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        const preco_unitario_no_momento = product[0].preco_unitario;

        await connection.query(
            `INSERT INTO itens_venda (id_venda, id_produto, quantidade, preco_unitario_no_momento) VALUES (?, ?, ?, ?)`,
            [id, id_produto, quantidade, preco_unitario_no_momento]
        );
        
        const total_item = preco_unitario_no_momento * quantidade;
        await connection.query(`UPDATE vendas SET total_venda = total_venda + ? WHERE id_venda = ?`, [total_item, id]);

        res.status(201).json({ message: 'Item adicionado à comanda.' });
    } catch (error) {
        console.error('Erro ao adicionar item à venda:', error);
        res.status(500).json({ error: 'Erro ao adicionar item à venda.' });
    } finally {
        if (connection) connection.end();
    }
});

app.delete('/api/vendas/:id/item/:id_item', async (req, res) => {
    const { id, id_item } = req.params;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [item] = await connection.query(`SELECT quantidade, preco_unitario_no_momento FROM itens_venda WHERE id_item_venda = ?`, [id_item]);
        if (item.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado na comanda.' });
        }
        
        await connection.query(`DELETE FROM itens_venda WHERE id_item_venda = ?`, [id_item]);
        
        const total_item_removido = item[0].quantidade * item[0].preco_unitario_no_momento;
        await connection.query(`UPDATE vendas SET total_venda = total_venda - ? WHERE id_venda = ?`, [total_item_removido, id]);

        res.json({ message: 'Item removido da comanda.' });
    } catch (error) {
        console.error('Erro ao remover item da venda:', error);
        res.status(500).json({ error: 'Erro ao remover item da venda.' });
    } finally {
        if (connection) connection.end();
    }
});

app.put('/api/vendas/:id/fechar', async (req, res) => {
    const { id } = req.params;
    const { metodo_pagamento } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `UPDATE vendas SET status_venda = 'fechada', data_fechamento = NOW(), metodo_pagamento = ? WHERE id_venda = ?`;
        const [result] = await connection.query(sql, [metodo_pagamento, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comanda não encontrada.' });
        }
        res.json({ message: 'Comanda fechada com sucesso.' });
    } catch (error) {
        console.error('Erro ao fechar comanda:', error);
        res.status(500).json({ error: 'Erro ao fechar a comanda.' });
    } finally {
        if (connection) connection.end();
    }
});

app.delete('/api/vendas/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.query(`DELETE FROM vendas WHERE id_venda = ?`, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comanda não encontrada.' });
        }
        res.json({ message: 'Comanda excluída com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir comanda:', error);
        res.status(500).json({ error: 'Erro ao excluir a comanda.' });
    } finally {
        if (connection) connection.end();
    }
});

// --- API Endpoints para RELATÓRIOS (NOVOS) ---

// Relatório 1: Faturamento Total do Dia detalhado por método de pagamento
app.get('/api/relatorios/faturamento', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Query para o total do dia
        const [totalDia] = await connection.query(`
            SELECT SUM(total_venda) AS total_dia 
            FROM vendas 
            WHERE status_venda = 'fechada' AND DATE(data_fechamento) = CURDATE()
        `);

        // Query para o total em dinheiro
        const [totalDinheiro] = await connection.query(`
            SELECT SUM(total_venda) AS total_dinheiro 
            FROM vendas 
            WHERE status_venda = 'fechada' AND DATE(data_fechamento) = CURDATE() AND metodo_pagamento = 'dinheiro'
        `);
        
        // Query para o total em cartão/pix
        const [totalCartaoPix] = await connection.query(`
            SELECT SUM(total_venda) AS total_cartao_pix 
            FROM vendas 
            WHERE status_venda = 'fechada' AND DATE(data_fechamento) = CURDATE() AND metodo_pagamento = 'cartao/pix'
        `);

        res.json({
            faturamento_total: totalDia[0].total_dia || 0,
            total_dinheiro: totalDinheiro[0].total_dinheiro || 0,
            total_cartao_pix: totalCartaoPix[0].total_cartao_pix || 0
        });
    } catch (error) {
        console.error('Erro ao obter faturamento total:', error);
        res.status(500).json({ error: 'Erro ao obter faturamento total.' });
    } finally {
        if (connection) connection.end();
    }
});

// Relatório 2: Vendas por Período e Todas as Vendas Fechadas
app.get('/api/relatorios/vendas_fechadas', async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        let sql;
        let params = [];

        if (data_inicio && data_fim) {
            sql = `
                SELECT 
                    id_venda, 
                    numero_mesa, 
                    total_venda, 
                    DATE_FORMAT(data_fechamento, '%d/%m/%Y %H:%i') as data_fechamento,
                    metodo_pagamento
                FROM vendas
                WHERE status_venda = 'fechada' AND data_fechamento BETWEEN ? AND ?
                ORDER BY data_fechamento DESC
            `;
            params = [data_inicio, data_fim];
        } else {
            sql = `
                SELECT 
                    id_venda, 
                    numero_mesa, 
                    total_venda, 
                    DATE_FORMAT(data_fechamento, '%d/%m/%Y %H:%i') as data_fechamento,
                    metodo_pagamento
                FROM vendas
                WHERE status_venda = 'fechada'
                ORDER BY data_fechamento DESC
            `;
        }
        
        const [rows] = await connection.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter vendas por período:', error);
        res.status(500).json({ error: 'Erro ao obter vendas por período.' });
    } finally {
        if (connection) connection.end();
    }
});

// Relatório 3: Produtos Mais Vendidos
app.get('/api/relatorios/produtos_mais_vendidos', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT 
                p.nome_produto,
                c.nome_categoria,
                SUM(iv.quantidade) AS total_vendido
            FROM itens_venda AS iv
            JOIN produtos AS p ON iv.id_produto = p.id_produto
            LEFT JOIN categorias AS c ON p.id_categoria = c.id_categoria
            GROUP BY p.nome_produto, c.nome_categoria
            ORDER BY total_vendido DESC
            LIMIT 10
        `;
        const [rows] = await connection.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao obter produtos mais vendidos:', error);
        res.status(500).json({ error: 'Erro ao obter produtos mais vendidos.' });
    } finally {
        if (connection) connection.end();
    }
});

// PUT: Reabre uma venda fechada
app.put('/api/vendas/:id/reabrir', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.query(`UPDATE vendas SET status_venda = 'aberta', data_fechamento = NULL WHERE id_venda = ?`, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Venda não encontrada.' });
        }
        res.json({ message: 'Venda reaberta com sucesso!' });
    } catch (error) {
        console.error('Erro ao reabrir venda:', error);
        res.status(500).json({ error: 'Erro ao reabrir a venda.' });
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
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
    password: 'P@ssword2018',
    database: 'vendas_db'
};

// --- Funções de Conexão e Inicialização ---

/**
 * Cria e retorna uma nova conexão com o banco de dados.
 * @returns {Promise<mysql.Connection>} A conexão com o banco de dados.
 */
const getConnection = async () => {
    return await mysql.createConnection(dbConfig);
};

/**
 * Inicializa o banco de dados e as tabelas, se não existirem.
 */
const initializeDatabase = async () => {
    let connection;
    try {
        // Passo 1: Cria uma conexão para verificar/criar o banco de dados.
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Banco de dados '${dbConfig.database}' verificado/criado com sucesso.`);
        connection.end();

        // Passo 2: Cria uma nova conexão já no banco de dados correto.
        connection = await getConnection();

        // Passo 3: Cria cada tabela individualmente para evitar erros de sintaxe.
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id_categoria INT AUTO_INCREMENT PRIMARY KEY,
                nome_categoria VARCHAR(255) NOT NULL UNIQUE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS produtos (
                id_produto INT AUTO_INCREMENT PRIMARY KEY,
                nome_produto VARCHAR(255) NOT NULL,
                descricao TEXT,
                preco_unitario DECIMAL(10, 2) NOT NULL,
                data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
                id_categoria INT,
                FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS vendas (
                id_venda INT AUTO_INCREMENT PRIMARY KEY,
                numero_mesa INT NOT NULL,
                status_venda VARCHAR(255) NOT NULL,
                data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_fechamento DATETIME,
                total_venda DECIMAL(10, 2) DEFAULT 0.00,
                total_itens INT DEFAULT 0,
                metodo_pagamento VARCHAR(255)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS itens_venda (
                id_item_venda INT AUTO_INCREMENT PRIMARY KEY,
                id_venda INT NOT NULL,
                id_produto INT NOT NULL,
                quantidade INT NOT NULL,
                preco_unitario_no_momento DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (id_venda) REFERENCES vendas(id_venda) ON DELETE CASCADE,
                FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE
            );
        `);

        console.log('Tabelas verificadas/criadas com sucesso.');

    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
        process.exit(1);
    } finally {
        if (connection) connection.end();
    }
};

// --- Funções de Auxílio ---

/**
 * Normaliza uma string para minúsculas e remove acentos.
 * @param {string} str A string a ser normalizada.
 * @returns {string|null} A string normalizada ou null se a entrada for inválida.
 */
const normalizeString = (str) => {
    if (str === null || str === undefined) return null;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

/**
 * Função utilitária para tratamento de erros em rotas.
 * @param {object} res O objeto de resposta do Express.
 * @param {Error} error O objeto de erro.
 * @param {string} message A mensagem de erro amigável.
 * @param {number} statusCode O código de status HTTP.
 */
const handleError = (res, error, message, statusCode = 500) => {
    console.error(`Erro: ${message}`, error);
    res.status(statusCode).json({ error: message });
};

// --- API Endpoints para CATEGORIAS ---

app.get('/api/categorias', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query('SELECT * FROM categorias ORDER BY nome_categoria ASC');
        res.json(rows);
    } catch (error) {
        handleError(res, error, 'Erro ao obter as categorias.');
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
        connection = await getConnection();
        const [result] = await connection.query('INSERT INTO categorias (nome_categoria) VALUES (?)', [nome]);
        res.status(201).json({ id: result.insertId, message: 'Categoria cadastrada com sucesso.' });
    } catch (error) {
        handleError(res, error, 'Erro ao cadastrar a categoria.');
    } finally {
        if (connection) connection.end();
    }
});

app.delete('/api/categorias/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let connection;
    try {
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da categoria inválido.' });
        }
        connection = await getConnection();
        const sql = `DELETE FROM categorias WHERE id_categoria = ?`;
        const [result] = await connection.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria excluída com sucesso.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            handleError(res, error, 'Não é possível excluir esta categoria porque há produtos associados a ela.', 409);
        } else {
            handleError(res, error, 'Erro ao excluir a categoria.');
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
        if (!nome || !preco) {
            return res.status(400).json({ error: 'Nome e preço do produto são obrigatórios.' });
        }
        nome = normalizeString(nome);
        descricao = normalizeString(descricao);
        connection = await getConnection();
        const sql = `INSERT INTO produtos (nome_produto, preco_unitario, descricao, id_categoria) VALUES (?, ?, ?, ?)`;
        const [result] = await connection.query(sql, [nome, preco, descricao, id_categoria]);
        res.status(201).json({ id: result.insertId, message: 'Produto cadastrado com sucesso.' });
    } catch (error) {
        handleError(res, error, 'Erro ao cadastrar o produto.');
    } finally {
        if (connection) connection.end();
    }
});

app.get('/api/produtos', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sql = `
            SELECT 
                p.id_produto, 
                p.nome_produto, 
                p.descricao, 
                p.preco_unitario,
                p.id_categoria,
                c.nome_categoria
            FROM produtos AS p
            LEFT JOIN categorias AS c ON p.id_categoria = c.id_categoria
            ORDER BY p.id_produto DESC
        `;
        const [rows] = await connection.query(sql);
        res.json(rows);
    } catch (error) {
        handleError(res, error, 'Erro ao buscar produtos.');
    } finally {
        if (connection) connection.end();
    }
});

app.put('/api/produtos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let { nome, preco, descricao, id_categoria } = req.body;
    let connection;
    try {
        if (isNaN(id) || !nome || !preco) {
            return res.status(400).json({ error: 'Dados do produto inválidos.' });
        }
        nome = normalizeString(nome);
        descricao = normalizeString(descricao);
        connection = await getConnection();
        const sql = `UPDATE produtos SET nome_produto = ?, preco_unitario = ?, descricao = ?, id_categoria = ? WHERE id_produto = ?`;
        const [result] = await connection.query(sql, [nome, preco, descricao, id_categoria, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json({ message: 'Produto atualizado com sucesso.' });
    } catch (error) {
        handleError(res, error, 'Erro ao atualizar o produto.');
    } finally {
        if (connection) connection.end();
    }
});

app.delete('/api/produtos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let connection;
    try {
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID do produto inválido.' });
        }
        connection = await getConnection();
        const sql = `DELETE FROM produtos WHERE id_produto = ?`;
        const [result] = await connection.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json({ message: 'Produto excluído com sucesso.' });
    } catch (error) {
        handleError(res, error, 'Erro ao excluir o produto.');
    } finally {
        if (connection) connection.end();
    }
});

// --- API Endpoints para VENDAS ---

app.get('/api/vendas/abertas', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sql = `
            SELECT 
                v.id_venda,
                v.numero_mesa,
                v.total_venda,
                COUNT(iv.id_item_venda) AS total_itens
            FROM vendas AS v
            LEFT JOIN itens_venda AS iv ON v.id_venda = iv.id_venda
            WHERE v.status_venda = 'aberta'
            GROUP BY v.id_venda
            ORDER BY v.numero_mesa ASC
        `;
        const [rows] = await connection.query(sql);
        res.json(rows);
    } catch (error) {
        handleError(res, error, 'Erro ao buscar vendas abertas.');
    } finally {
        if (connection) connection.end();
    }
});

app.post('/api/vendas/abrir', async (req, res) => {
    const { numero_mesa } = req.body;
    let connection;
    try {
        const mesa = parseInt(numero_mesa, 10);
        if (isNaN(mesa) || mesa <= 0) {
            return res.status(400).json({ error: 'O número da mesa deve ser um número inteiro positivo.' });
        }

        connection = await getConnection();
        const [existing] = await connection.query(`SELECT * FROM vendas WHERE numero_mesa = ? AND status_venda = 'aberta'`, [mesa]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Já existe uma comanda aberta para esta mesa.' });
        }
        
        const sql = `INSERT INTO vendas (numero_mesa, status_venda) VALUES (?, 'aberta')`;
        const [result] = await connection.query(sql, [mesa]);
        
        res.status(201).json({ id_venda: result.insertId, numero_mesa: mesa, message: 'Comanda aberta com sucesso.' });
    } catch (error) {
        handleError(res, error, 'Erro ao abrir a comanda.');
    } finally {
        if (connection) connection.end();
    }
});

app.get('/api/vendas/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let connection;
    try {
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da venda inválido.' });
        }
        connection = await getConnection();
        const sql = `
            SELECT 
                v.total_venda,
                iv.id_item_venda, 
                iv.quantidade, 
                iv.preco_unitario_no_momento,
                p.nome_produto
            FROM vendas AS v
            LEFT JOIN itens_venda AS iv ON v.id_venda = iv.id_venda
            LEFT JOIN produtos AS p ON iv.id_produto = p.id_produto
            WHERE v.id_venda = ?
        `;
        const [rows] = await connection.query(sql, [id]);

        // Se a venda não tem itens, ela pode ainda existir.
        if (rows.length === 0) {
            const [vendaResult] = await connection.query(`SELECT total_venda FROM vendas WHERE id_venda = ?`, [id]);
            if (vendaResult.length === 0) {
                return res.status(404).json({ error: 'Venda não encontrada.' });
            }
            return res.json({ items: [], total: vendaResult[0].total_venda });
        }

        const totalVenda = rows[0].total_venda;
        const items = rows.map(row => ({
            id_item_venda: row.id_item_venda,
            quantidade: row.quantidade,
            preco_unitario_no_momento: row.preco_unitario_no_momento,
            nome_produto: row.nome_produto
        }));

        res.json({ items, total: totalVenda });
    } catch (error) {
        handleError(res, error, 'Erro ao buscar detalhes da venda.');
    } finally {
        if (connection) connection.end();
    }
});

app.post('/api/vendas/:id/item', async (req, res) => {
    const id = parseInt(req.params.id);
    const { id_produto, quantidade } = req.body;
    let connection;
    try {
        if (isNaN(id) || !id_produto || !quantidade || isNaN(quantidade) || quantidade <= 0) {
            return res.status(400).json({ error: 'Dados inválidos.' });
        }
        connection = await getConnection();
        
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
        await connection.query(`UPDATE vendas SET total_venda = total_venda + ?, total_itens = total_itens + ? WHERE id_venda = ?`, [total_item, quantidade, id]);

        res.status(201).json({ message: 'Item adicionado à comanda.' });
    } catch (error) {
        handleError(res, error, 'Erro ao adicionar item à venda.');
    } finally {
        if (connection) connection.end();
    }
});

app.delete('/api/vendas/:idVenda/item/:idItem', async (req, res) => {
    const idVenda = parseInt(req.params.idVenda);
    const idItem = parseInt(req.params.idItem);
    let connection;
    try {
        if (isNaN(idVenda) || isNaN(idItem)) {
            return res.status(400).json({ error: 'IDs de venda ou item inválidos.' });
        }

        connection = await getConnection();
        const [item] = await connection.query(`SELECT quantidade, preco_unitario_no_momento FROM itens_venda WHERE id_item_venda = ? AND id_venda = ?`, [idItem, idVenda]);
        if (item.length === 0) {
            return res.status(404).json({ error: 'Item não encontrado na comanda.' });
        }
        
        await connection.query(`DELETE FROM itens_venda WHERE id_item_venda = ?`, [idItem]);
        
        const total_item_removido = item[0].quantidade * item[0].preco_unitario_no_momento;
        await connection.query(`UPDATE vendas SET total_venda = total_venda - ?, total_itens = total_itens - ? WHERE id_venda = ?`, [total_item_removido, item[0].quantidade, idVenda]);

        res.json({ message: 'Item removido da comanda.' });
    } catch (error) {
        handleError(res, error, 'Erro ao remover item da venda.');
    } finally {
        if (connection) connection.end();
    }
});

app.put('/api/vendas/:id/fechar', async (req, res) => {
    const id = parseInt(req.params.id);
    const { metodo_pagamento } = req.body;
    let connection;
    try {
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da venda inválido.' });
        }
        connection = await getConnection();
        const sql = `UPDATE vendas SET status_venda = 'fechada', data_fechamento = NOW(), metodo_pagamento = ? WHERE id_venda = ? AND status_venda = 'aberta'`;
        const [result] = await connection.query(sql, [metodo_pagamento, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comanda não encontrada ou já está fechada.' });
        }
        res.json({ message: 'Comanda fechada com sucesso.' });
    } catch (error) {
        handleError(res, error, 'Erro ao fechar a comanda.');
    } finally {
        if (connection) connection.end();
    }
});

app.delete('/api/vendas/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let connection;
    try {
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da venda inválido.' });
        }
        connection = await getConnection();
        const [result] = await connection.query(`DELETE FROM vendas WHERE id_venda = ?`, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comanda não encontrada.' });
        }
        res.json({ message: 'Comanda excluída com sucesso.' });
    } catch (error) {
        handleError(res, error, 'Erro ao excluir a comanda.');
    } finally {
        if (connection) connection.end();
    }
});

// --- API Endpoints para RELATÓRIOS ---

app.get('/api/relatorios/faturamento', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const [totalDia] = await connection.query(`
            SELECT SUM(total_venda) AS total_dia 
            FROM vendas 
            WHERE status_venda = 'fechada' AND DATE(data_fechamento) = CURDATE()
        `);

        const [totalDinheiro] = await connection.query(`
            SELECT SUM(total_venda) AS total_dinheiro 
            FROM vendas 
            WHERE status_venda = 'fechada' AND DATE(data_fechamento) = CURDATE() AND metodo_pagamento = 'dinheiro'
        `);
        
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
        handleError(res, error, 'Erro ao obter faturamento total.');
    } finally {
        if (connection) connection.end();
    }
});

app.get('/api/relatorios/vendas_fechadas', async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    let connection;
    try {
        connection = await getConnection();
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
        handleError(res, error, 'Erro ao obter vendas por período.');
    } finally {
        if (connection) connection.end();
    }
});

app.get('/api/relatorios/produtos_mais_vendidos', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
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
        handleError(res, error, 'Erro ao obter produtos mais vendidos.');
    } finally {
        if (connection) connection.end();
    }
});

app.put('/api/vendas/:id/reabrir', async (req, res) => {
    const id = parseInt(req.params.id);
    let connection;
    try {
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID da venda inválido.' });
        }
        connection = await getConnection();
        const [result] = await connection.query(`UPDATE vendas SET status_venda = 'aberta', data_fechamento = NULL WHERE id_venda = ?`, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Venda não encontrada.' });
        }
        res.json({ message: 'Venda reaberta com sucesso!' });
    } catch (error) {
        handleError(res, error, 'Erro ao reabrir a venda.');
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
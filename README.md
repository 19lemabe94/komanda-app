# Komanda App

Uma aplicação web simples e minimalista para gerenciamento de vendas e cadastro de produtos, construída com um sistema de login básico. O projeto serve como uma base para a criação de um sistema de vendas completo.

---

## 🚀 Funcionalidades

* **Autenticação de Usuário**: Tela de login com validação simples.
* **Gestão de Produtos (CRUD)**:
    * **C**adastro, **E**dição e **E**xclusão de produtos.
    * Seleção de múltiplos itens para exclusão em massa.
    * Normalização de dados (remoção de acentos e conversão para minúsculas).
* **Gestão de Comandas (Vendas)**:
    * Painel de mesas (de 1 a 10) com status da comanda.
    * **Abertura** de novas comandas para mesas livres.
    * **Visualização detalhada** da comanda (lista de itens, total) com efeito de expansão.
    * **Adição e remoção de itens** da comanda em tempo real.
    * **Fechamento** e **exclusão** completa de comandas.

---

## 💻 Tecnologias Utilizadas

**Front-end:**
* **HTML5** & **CSS3**: Estrutura e estilização das páginas (CSS separado para melhor manutenção).
* **JavaScript**: Lógica de interação com o back-end (chamadas de API e manipulação da interface).
* **Google Fonts**: Tipografia moderna para um design mais limpo.

**Back-end:**
* **Node.js**: Ambiente de execução do servidor.
* **Express.js**: Framework para criação da API REST.
* **mysql2**: Driver para conexão com o banco de dados MySQL.

**Banco de Dados:**
* **MySQL**: Sistema de gerenciamento de banco de dados relacional.

---

## ⚙️ Como Começar

Siga estes passos para configurar e rodar a aplicação no seu ambiente local.

### Pré-requisitos

Certifique-se de ter o seguinte software instalado:
* **Node.js & npm**: [Baixe aqui](https://nodejs.org/) (versão LTS é recomendada).
* **MySQL Server**: [Baixe e instale o MySQL Server](https://dev.mysql.com/downloads/mysql/).

### 1. Configuração do Back-end

1.  Navegue até a pasta `backend` no seu terminal.
    ```bash
    cd backend
    ```
2.  Instale as dependências do Node.js.
    ```bash
    npm install
    ```
3.  Abra o arquivo `server.js` e preencha as credenciais do seu banco de dados MySQL na constante `dbConfig`.
    ```javascript
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: 'sua_senha_aqui', // <-- Coloque sua senha aqui
        database: 'vendas_db'
    };
    ```
4.  Inicie o servidor. Ele irá se conectar ao MySQL e criar o banco de dados e as tabelas automaticamente.
    ```bash
    node server.js
    ```
    Se tudo estiver correto, você verá a mensagem `Servidor rodando em http://localhost:3000`.

### 2. Acesso ao Front-end

Com o servidor rodando, abra o seu navegador de internet e navegue até a pasta raiz do projeto.

1.  Abra o arquivo `index.html`.
    ```
    file:///Z:/caminho/do/seu/projeto/index.html
    ```
2.  Use as credenciais de login que você definiu no `server.js` para acessar a aplicação. O padrão é `usuário: admin` e `senha: 12345`.

---

## 🚀 Próximos Passos

A aplicação está funcional, mas pode ser expandida com estas novas ideias:

* **Tela de Relatórios**: Criar a tela `relatorio.html` para exibir o histórico de vendas, produtos mais vendidos, faturamento por período, etc.
* **Estilização Avançada**: Melhorar o design e a responsividade.
* **Autenticação**: Adicionar um sistema de login mais completo, com diferentes níveis de acesso (ex: gerente, caixa).

---

## 👤 Autor

* **19lemabe94** - [github.com/19lemabe94](https://github.com/19lemabe94)

---

## 📄 Licença

Este projeto está sob a licença [MIT](https://opensource.org/licenses/MIT).# Komanda App

Uma aplicação web simples e minimalista para gerenciamento de vendas e cadastro de produtos, construída com um sistema de login básico. O projeto serve como uma base para a criação de um sistema de vendas completo.

---

## 🚀 Funcionalidades

* **Autenticação de Usuário**: Tela de login com validação simples.
* **Gestão de Produtos (CRUD)**:
    * **C**adastro, **E**dição e **E**xclusão de produtos.
    * Seleção de múltiplos itens para exclusão em massa.
    * Normalização de dados (remoção de acentos e conversão para minúsculas).
* **Gestão de Comandas (Vendas)**:
    * Painel de mesas (de 1 a 10) com status da comanda.
    * **Abertura** de novas comandas para mesas livres.
    * **Visualização detalhada** da comanda (lista de itens, total) com efeito de expansão.
    * **Adição e remoção de itens** da comanda em tempo real.
    * **Fechamento** e **exclusão** completa de comandas.

---

## 💻 Tecnologias Utilizadas

**Front-end:**
* **HTML5** & **CSS3**: Estrutura e estilização das páginas (CSS separado para melhor manutenção).
* **JavaScript**: Lógica de interação com o back-end (chamadas de API e manipulação da interface).
* **Google Fonts**: Tipografia moderna para um design mais limpo.

**Back-end:**
* **Node.js**: Ambiente de execução do servidor.
* **Express.js**: Framework para criação da API REST.
* **mysql2**: Driver para conexão com o banco de dados MySQL.

**Banco de Dados:**
* **MySQL**: Sistema de gerenciamento de banco de dados relacional.

---

## ⚙️ Como Começar

Siga estes passos para configurar e rodar a aplicação no seu ambiente local.

### Pré-requisitos

Certifique-se de ter o seguinte software instalado:
* **Node.js & npm**: [Baixe aqui](https://nodejs.org/) (versão LTS é recomendada).
* **MySQL Server**: [Baixe e instale o MySQL Server](https://dev.mysql.com/downloads/mysql/).

### 1. Configuração do Back-end

1.  Navegue até a pasta `backend` no seu terminal.
    ```bash
    cd backend
    ```
2.  Instale as dependências do Node.js.
    ```bash
    npm install
    ```
3.  Abra o arquivo `server.js` e preencha as credenciais do seu banco de dados MySQL na constante `dbConfig`.
    ```javascript
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: 'sua_senha_aqui', // <-- Coloque sua senha aqui
        database: 'vendas_db'
    };
    ```
4.  Inicie o servidor. Ele irá se conectar ao MySQL e criar o banco de dados e as tabelas automaticamente.
    ```bash
    node server.js
    ```
    Se tudo estiver correto, você verá a mensagem `Servidor rodando em http://localhost:3000`.

### 2. Acesso ao Front-end

Com o servidor rodando, abra o seu navegador de internet e navegue até a pasta raiz do projeto.

1.  Abra o arquivo `index.html`.
    ```
    file:///Z:/caminho/do/seu/projeto/index.html
    ```
2.  Use as credenciais de login que você definiu no `server.js` para acessar a aplicação. O padrão é `usuário: admin` e `senha: 12345`.

---

## 🚀 Próximos Passos

A aplicação está funcional, mas pode ser expandida com estas novas ideias:

* **Tela de Relatórios**: Criar a tela `relatorio.html` para exibir o histórico de vendas, produtos mais vendidos, faturamento por período, etc.
* **Estilização Avançada**: Melhorar o design e a responsividade.
* **Autenticação**: Adicionar um sistema de login mais completo, com diferentes níveis de acesso (ex: gerente, caixa).

---

## 👤 Autor

* **19lemabe94** - [github.com/19lemabe94](https://github.com/19lemabe94)

---

## 📄 Licença

Este projeto está sob a licença [MIT](https://opensource.org/licenses/MIT).
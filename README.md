# Komanda App

![Komanda App - Banner](https://via.placeholder.com/1200x400.png?text=Komanda+App+-+Gerenciamento+de+Vendas)

## 📌 Sobre o Projeto

O Komanda App é uma aplicação web de gerenciamento de vendas e comandas, ideal para estabelecimentos como bares e restaurantes. Desenvolvido com uma arquitetura de pilha completa (Full-Stack), ele oferece uma interface intuitiva para controle de mesas, registro de pedidos e geração de relatórios gerenciais em tempo real.

O projeto foi construído utilizando as seguintes tecnologias:

* **Frontend**: HTML, CSS e JavaScript (Vanilla JS).
* **Backend**: Node.js com Express.
* **Banco de Dados**: MySQL.

---

## ✨ Funcionalidades

O sistema oferece um conjunto de funcionalidades robusto para o dia a dia de um estabelecimento:

### 1. Gerenciamento de Mesas e Comandas
A tela principal exibe o status de todas as mesas. É possível abrir novas comandas, adicionar produtos, finalizar vendas com diferentes métodos de pagamento e, se necessário, excluir comandas.

**Adicionar Itens a uma Comanda:**
Uma vez que a comanda está aberta, é possível adicionar produtos facilmente, com o sistema calculando automaticamente o valor total.

![Tela de Vendas](https://i.ibb.co/ZwTpVXp/homekomanda.jpg)

**Impressão de Comandas:**
A aplicação permite a impressão da comanda em um formato de recibo simplificado, útil para o controle do caixa ou para o cliente.

### 2. Relatórios Gerenciais
A página de relatórios fornece uma visão estratégica do negócio, permitindo acompanhar o desempenho das vendas.

* **Faturamento do Dia:** Mostra o total arrecadado no dia, detalhado por método de pagamento (Dinheiro e Cartão/Pix).
* **Histórico de Vendas:** Permite filtrar vendas fechadas por período, com a opção de exclusão de registros.
* **Produtos Mais Vendidos:** Um ranking dos itens mais populares, ajudando na gestão do estoque e na tomada de decisões.

![Tela de Relatórios](https://i.ibb.co/R8L6LZ9/relatoiokomanda.jpg)

### 3. Cadastro de Produtos
A área de cadastro permite a gestão completa do cardápio.

* **Cadastro e Edição:** Adicione novos produtos com nome, preço e descrição. É possível editar produtos existentes com facilidade.
* **Categorias:** Organize seus produtos em categorias para uma melhor visualização no sistema de vendas.
* **Exclusão em Massa:** Gerencie o cardápio de forma eficiente, com a opção de excluir múltiplos produtos de uma vez.

![Tela de Cadastro](https://i.ibb.co/Q32MH8PH/cadastrokomanda.jpg)

---

## 🚀 Como Executar o Projeto

Para configurar e rodar a aplicação em sua máquina, siga os passos abaixo:

### Pré-requisitos

* [Node.js](https://nodejs.org/): Necessário para rodar o backend.
* [MySQL Server](https://www.mysql.com/downloads/): O banco de dados do projeto.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [URL_DO_SEU_REPOSITORIO]
    cd Komanda-app/backend
    ```

2.  **Instale as dependências do backend:**
    ```bash
    npm install
    ```

3.  **Configure o banco de dados:**
    * No arquivo `server.js`, ajuste as credenciais de conexão do MySQL na variável `dbConfig`.
    * O servidor irá criar o banco de dados `vendas_db` e as tabelas automaticamente na primeira execução.

4.  **Inicie o servidor:**
    ```bash
    node server.js
    ```
    O servidor estará rodando em `http://localhost:3000`.

5.  **Acesse o frontend:**
    Abra o arquivo `home.html` em seu navegador para começar a usar a aplicação. Certifique-se de que o servidor Node.js está em execução.

---

## 🧑‍💻 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma _issue_ ou enviar um _pull request_ com melhorias, novas funcionalidades ou correções de bugs.

1.  Faça um Fork do projeto.
2.  Crie uma nova branch (`git checkout -b feature/sua-feature`).
3.  Faça suas alterações (`git commit -m 'feat: adicionei nova feature'`).
4.  Envie para a branch (`git push origin feature/sua-feature`).
5.  Abra um Pull Request.

---

## 📝 Licença

Este projeto está licenciado sob a Licença MIT.


## 👤 Autor



* **19lemabe94** - [github.com/19lemabe94](https://github.com/19lemabe94)



---
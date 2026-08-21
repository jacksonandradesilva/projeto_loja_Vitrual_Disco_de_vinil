# The Roots - Loja de Vinis

Uma loja virtual de discos de vinil com catálogo de produtos, carrinho de compras, painel administrativo e experiência de compra moderna em React.

## 🎵 Visão geral

Este projeto reúne:

- frontend em React + Vite
- backend em Node.js + Express
- API REST para catálogo, produtos e checkout
- armazenamento em MongoDB quando disponível
- fallback para catálogo em memória caso o banco não esteja ativo
- interface para navegação, busca e administração de produtos

## 🧩 Tecnologias

- React 18
- Vite
- Express
- MongoDB + Mongoose
- Node.js
- HTML/CSS + JavaScript

## 📁 Estrutura do projeto

```text
projeto_loja_Vitrual_Disco_de_vinil/
├── backend/
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── public/
│   └── assets/
├── package.json
├── README.md
└── .gitignore
```

## ✅ Funcionalidades

- catálogo de vinis com filtros e busca
- detalhe de produto com player de preview de músicas
- carrinho de compras
- checkout simulado via API
- painel administrativo para cadastrar e editar produtos
- imagens e ações com layout visual modernizado

## ⚙️ Requisitos

Antes de iniciar, certifique-se de ter instalado:

- Node.js 18+
- npm
- MongoDB local opcional (o backend consegue funcionar sem ele usando catálogo em memória)

## 🚀 Instalação

No diretório raiz do projeto, execute:

```bash
npm install
```

Se o frontend também precisar instalar dependências separadamente:

```bash
cd frontend
npm install
```

## ▶️ Como executar

### Opção 1: rodar frontend e backend juntos

Na raiz do projeto:

```bash
npm run dev
```

Isso inicia:

- backend em http://localhost:3001
- frontend em http://localhost:5173

### Opção 2: rodar somente o backend

```bash
npm run dev:server
```

### Opção 3: rodar somente o frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

## 🏗️ Build de produção

Para gerar a versão de produção do frontend:

```bash
npm run build
```

Para visualizar a build localmente:

```bash
npm run preview
```

## 🔌 API principal

O backend expõe os seguintes endpoints:

- GET /api/catalog — lista os produtos
- POST /api/products — cria um produto
- PUT /api/products/:id — atualiza um produto
- DELETE /api/products/:id — remove um produto
- POST /api/checkout — finaliza pedido do carrinho

## 🗄️ Banco de dados

O backend tenta conectar ao MongoDB usando:

```bash
mongodb://127.0.0.1:27017/vinil_store
```

Se a conexão falhar, o sistema usa um catálogo em memória para manter a aplicação funcionando sem interrupção.

## 🛠️ Scripts disponíveis

No arquivo package.json da raiz:

```json
{
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:server": "node backend/server.js",
  "dev:client": "cd frontend && npm run dev -- --host 0.0.0.0",
  "build": "cd frontend && npm run build",
  "preview": "cd frontend && npm run preview -- --host 0.0.0.0"
}
```

## 👤 Sobre o projeto

O projeto simula uma loja de vinis moderna, com foco em experiência visual, catálogo de discos e gestão de produtos. Ele é uma excelente base para estudar:

- React e componentização
- consumo de APIs com fetch
- Express e Node.js
- organização de projetos full stack
- integração de frontend com backend

## 📌 Observações

- A imagem do logo e assets públicos ficam na pasta public/assets
- O servidor serve também os arquivos gerados no frontend na pasta frontend/dist
- O projeto foi estruturado para facilitar estudos e evolução futura

## 🚀 Próximos passos sugeridos

- adicionar autenticação de administrador
- integrar com banco de dados definitivo em produção
- criar paginação no catálogo
- melhorar checkout com pagamento real
- implementar favoritos e avaliações de produtos

---

Desenvolvido para estudo e evolução de um e-commerce de vinil.

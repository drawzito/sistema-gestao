# Sistema de Gestão Empresarial

Este sistema foi criado para substituir a planilha de acompanhamento mensal, oferecendo maior performance e segurança dos dados.

## Funcionalidades
- **Dashboard**: Visão geral dos indicadores de desempenho.
- **Colaboradores**: Lista completa com busca e status.
- **Métricas**: Histórico de desempenho (em desenvolvimento).
- **Importação**: Dados migrados da planilha Excel original.

## Como Rodar

### Pré-requisitos
- Node.js instalado.

### Passo a Passo

1. **Backend (Servidor)**
   Abra um terminal e rode:
   ```bash
   cd server
   npm install
   node server.js
   ```
   O servidor rodará na porta 3001.

2. **Frontend (Interface)**
   Abra *outro* terminal e rode:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   O navegador abrirá automaticamente em `http://localhost:5173`.

## Estrutura
- `/server`: API e Banco de Dados (SQLite).
- `/client`: Interface React.

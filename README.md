# 🛡️ Secure Vault - TCC Cibersegurança

Plataforma de armazenamento seguro baseada na arquitetura **Zero-Knowledge** (Conhecimento Zero).
O sistema garante que nem mesmo o servidor possui acesso aos dados dos usuários, utilizando criptografia ponta-a-ponta no navegador (Client-Side Encryption).

## 🚀 Tecnologias Utilizadas

- **Frontend:** React.js + Vite
- **Backend:** Node.js + Express
- **Banco de Dados:** MongoDB Atlas (Nuvem)
- **Criptografia:** Web Crypto API (Nativa do Browser)
  - *Algoritmo de Chave:* PBKDF2 (SHA-256)
  - *Algoritmo de Cifra:* AES-GCM (256 bits)

## 📋 Pré-requisitos

- Node.js (v18 ou superior)
- Conexão com Internet (para o Banco de Dados)

## 🔧 Instalação e Execução

### 1. Backend (Servidor)
O servidor é responsável pela autenticação e armazenamento dos blobs criptografados.

```bash
cd server
npm install
node server.js
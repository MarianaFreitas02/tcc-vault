# TCC VAULT - Sistema de Armazenamento Criptografado (Client-Side Encryption)

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Stable-blue)
![Security](https://img.shields.io/badge/encryption-AES--GCM-red)

## 🔐 Sobre o Projeto

O **TCC VAULT** é uma aplicação de cofre digital desenvolvida com foco em **Privacidade Zero-Knowledge**. Diferente de sistemas tradicionais (como Google Drive ou Dropbox), onde o servidor possui as chaves para ler os arquivos, o TCC VAULT realiza toda a criptografia **no navegador do cliente** antes que qualquer dado seja enviado à rede.

O servidor armazena apenas "blobs" binários criptografados e não possui capacidade matemática para ler o conteúdo dos usuários, garantindo confidencialidade mesmo em caso de vazamento de banco de dados.

### 🚀 Funcionalidades Principais

* **Criptografia Militar (AES-GCM 256-bit):** Arquivos são cifrados localmente.
* **Plausible Deniability (Negação Plausível):** O mesmo CPF pode ter múltiplos cofres (Senha, PIN, Frase), permitindo ocultar o cofre real em situações de coação.
* **Autenticação Robusta:** Derivação de chaves usando PBKDF2 com Salt único por usuário.
* **UX Tática:** Interface imersiva, Drag & Drop de arquivos e feedback visual de segurança.
* **Segurança Ativa:** Auto-logout após 5 minutos de inatividade.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **React + Vite:** Performance e reatividade.
* **Web Crypto API:** API nativa do navegador para operações criptográficas de alta performance.
* **Lucide React:** Ícones vetoriais leves.

### Backend (Serverless)
* **Node.js (Vercel Functions):** Arquitetura escalável e sem servidor fixo.
* **Express:** Roteamento de API.
* **Mongoose:** Modelagem de dados.

### Banco de Dados
* **MongoDB Atlas:** Armazenamento NoSQL distribuído.

---

## 🧠 Arquitetura de Segurança

O fluxo de segurança segue o padrão **Encrypt-then-Upload**:

1.  **Cadastro/Derivação:**
    * Usuário digita a senha.
    * O sistema gera um `Salt` aleatório (16 bytes).
    * `PBKDF2` (100.000 iterações) deriva a **Chave Mestra** a partir da (Senha + Salt).
    * O hash de autenticação (sha-256) é enviado ao servidor. A Chave Mestra **nunca** sai da memória RAM do cliente.

2.  **Criptografia de Arquivo:**
    * Um vetor de inicialização (`IV`) único é gerado para cada arquivo.
    * O arquivo é criptografado usando `AES-GCM` com a Chave Mestra e o IV.
    * O servidor recebe: `{ iv, conteudo_cifrado, tipo_mime, nome_falso }`.

3.  **Segurança de Dados:**
    * O banco de dados vê apenas strings aleatórias (Base64).
    * Não há "Backdoor" para recuperação de senha (se o usuário esquecer, os dados são perdidos para sempre).

---


## 🔧 Como Rodar Localmente

Pré-requisitos: Node.js v18+ e uma conta no MongoDB Atlas.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU_USUARIO/tcc-vault.git](https://github.com/SEU_USUARIO/tcc-vault.git)
    cd tcc-vault
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Ambiente:**
    * Crie um arquivo `.env` na raiz.
    * Adicione sua string de conexão: `VITE_API_URL=http://localhost:3000` (se rodar back local) ou a URL da Vercel.

4.  **Execute:**
    ```bash
    npm run dev
    ```

---

## ⚠️ Aviso Legal

Este projeto é uma **Prova de Conceito (PoC)** acadêmica. Embora utilize algoritmos padrão de mercado (NIST approved), recomenda-se auditoria profissional antes do uso para armazenamento de dados críticos em produção.

---

**Desenvolvido por Mariana Freitas**

# 🔐 Secure Vault: Zero-Knowledge Storage

> Aplicação web de armazenamento seguro onde a privacidade é garantida matematicamente, não por confiança.

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📌 Sobre o Projeto
Este projeto é parte do meu Trabalho de Conclusão de Curso (TCC) em Engenharia de Computação. O objetivo foi criar uma alternativa aos serviços de nuvem tradicionais (Google Drive, Dropbox) implementando uma arquitetura **Zero-Knowledge (Conhecimento Zero)**.

Diferente de sistemas convencionais, no Secure Vault, **a criptografia ocorre no lado do cliente (navegador)** antes do upload. O servidor armazena apenas blobs cifrados e nunca tem acesso às chaves de descriptografia.

## 🏗 Arquitetura & Segurança
A segurança do sistema baseia-se em três pilares implementados via **Web Crypto API**:

1.  **Cifragem Simétrica (AES-GCM):** Os arquivos são encriptados com uma chave única gerada no momento do upload.
2.  **Derivação de Chaves (PBKDF2):** A chave de acesso do usuário deriva da senha mestra com *salt* criptográfico, garantindo proteção contra ataques de força bruta.
3.  **Vetor de Inicialização (IV):** Cada arquivo possui um IV único, impedindo padrões repetitivos na cifra.

### Fluxo de Dados
`Usuário (Arquivo Claro)` ➝ `Browser (Encriptação AES-GCM)` ➝ `Envio HTTPS` ➝ `Servidor (Armazena Blob Cifrado)`

## 🚀 Tecnologias Utilizadas

* **Frontend:** React.js, Vite, TailwindCSS
* **Segurança:** Web Crypto API (Nativo do browser)
* **Backend:** Node.js, Express
* **Banco de Dados:** MongoDB (Metadados), Local Storage (Gestão de Sessão)

## 📦 Como Rodar Localmente

### Pré-requisitos
* Node.js v18+
* MongoDB rodando localmente ou Atlas URI

### Instalação

1. Clone o repositório
\`\`\`bash
git clone https://github.com/MarianaFreitas02/secure-vault.git
\`\`\`

2. Instale as dependências (Client e Server)
\`\`\`bash
cd server && npm install
cd ../client && npm install
\`\`\`

3. Configure as variáveis de ambiente (.env)
\`\`\`env
PORT=5000
MONGO_URI=sua_string_conexao
JWT_SECRET=seu_segredo_jwt
\`\`\`

4. Rode a aplicação
\`\`\`bash
# No terminal do server
npm start

# No terminal do client
npm run dev
\`\`\`

---
Desenvolvido por [Mariana Freitas](https://www.linkedin.com/in/ymarianafreitas/)

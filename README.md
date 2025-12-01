# 🔐 Secure Vault: Zero-Knowledge Storage

> Aplicação web de armazenamento seguro onde a privacidade é garantida matematicamente, não por confiança.

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tcc-vault.vercel.app/login)
![Status](https://img.shields.io/badge/Status-Concluído-00FF00?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## 📌 Sobre o Projeto
Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC) em Engenharia de Computação. O objetivo foi criar uma alternativa aos serviços de nuvem tradicionais, implementando uma arquitetura **Zero-Knowledge (Conhecimento Zero)**.

Diferente de sistemas convencionais, no Secure Vault, **a criptografia ocorre no lado do cliente (navegador)** antes do upload. O servidor armazena apenas dados cifrados e nunca tem acesso às chaves de descriptografia.

### 🔗 [Acesse o Deploy (Demo)](https://tcc-vault.vercel.app/login)

---

## 🏗 Arquitetura & Segurança
A segurança do sistema baseia-se em três pilares implementados via **Web Crypto API**:

1.  **Cifragem Simétrica (AES-GCM):** Os arquivos são encriptados com uma chave única gerada no momento do upload.
2.  **Derivação de Chaves (PBKDF2):** A chave de acesso do usuário deriva da senha mestra com *salt* criptográfico, garantindo proteção contra ataques de força bruta.
3.  **Vetor de Inicialização (IV):** Cada arquivo possui um IV único, impedindo padrões repetitivos na cifra.

### Fluxo de Dados
```mermaid
sequenceDiagram
    participant User as Usuário
    participant Browser as Cliente (React + WebCrypto)
    participant Server as Servidor (Node.js)
    participant DB as MongoDB

    User->>Browser: Seleciona Arquivo e Senha
    Browser->>Browser: Gera Chave AES (PBKDF2)
    Browser->>Browser: Encripta Arquivo (AES-GCM)
    Browser->>Server: Envia Arquivo Cifrado (Blob)
    Note over Server: Servidor não vê o conteúdo real
    Server->>DB: Armazena Blob Cifrado
    DB-->>Server: Confirmação
    Server-->>Browser: Upload Concluído

Com certeza. Aqui está o código completo, formatado e pronto. É só copiar o bloco abaixo inteiro e colar no arquivo `README.md` dentro do repositório `tcc-vault`.

Ele já inclui os badges, o diagrama de arquitetura que o GitHub renderiza automaticamente e os links corretos.

````markdown
# 🔐 Secure Vault: Zero-Knowledge Storage

> Aplicação de armazenamento seguro onde a privacidade é garantida matematicamente.

[![Deploy Vercel](https://img.shields.io/badge/Acessar_Aplicação-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tcc-vault.vercel.app/login)
![Status](https://img.shields.io/badge/Status-Concluído-00FF00?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Client_Side_Encryption-blue?style=for-the-badge)

## 📌 Sobre o Projeto

Este projeto foi desenvolvido durante a graduação em **Engenharia de Computação**. O objetivo foi criar uma alternativa aos serviços de nuvem tradicionais (como Google Drive ou Dropbox), implementando uma arquitetura **Zero-Knowledge**.

### O Diferencial
Em nuvens tradicionais, o servidor possui a chave para ler seus arquivos. No **Secure Vault**:
1.  A criptografia acontece no seu navegador (Client-Side).
2.  O servidor recebe apenas um código embaralhado (Blob cifrado).
3.  **Nem o administrador do sistema consegue ler o conteúdo dos arquivos.**

---

## 🏗 Arquitetura & Engenharia de Segurança

A segurança do sistema não depende de confiança, mas de criptografia forte implementada via **Web Crypto API** (nativa do browser).

### Pilares da Criptografia
* **Algoritmo AES-GCM (256-bit):** Usado para cifrar o conteúdo do arquivo. Garante confidencialidade e integridade.
* **PBKDF2 (Derivação de Chave):** A chave de criptografia é derivada da senha do usuário com milhares de iterações e um *salt* aleatório, protegendo contra ataques de força bruta.
* **Vetor de Inicialização (IV):** Cada arquivo tem um IV único. Mesmo que você envie dois arquivos idênticos, eles gerarão códigos cifrados totalmente diferentes.

### Fluxo de Dados (Diagrama)

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Browser as Cliente (React + WebCrypto)
    participant Server as Servidor (Node.js)
    participant DB as MongoDB

    Note over Browser: Criptografia ocorre AQUI 🔒
    User->>Browser: Seleciona Arquivo + Senha
    Browser->>Browser: Gera Chave (PBKDF2) + IV
    Browser->>Browser: Cifra Arquivo (AES-GCM)
    
    Note over Server: Servidor recebe apenas lixo cifrado
    Browser->>Server: Envia Blob Cifrado via HTTPS
    Server->>DB: Salva Blob + Metadados
    DB-->>Server: Confirmação
    Server-->>Browser: Upload Concluído
````

-----

## 🛠 Tech Stack

  * **Frontend:** React.js, Vite, TailwindCSS
  * **Backend:** Node.js, Express
  * **Database:** MongoDB Atlas
  * **Security:** Web Crypto API, JWT (Autenticação), bcrypt (Hash de senhas de login)

-----

## 📦 Como Rodar Localmente

Se você quiser clonar e testar na sua máquina:

### Pré-requisitos

  * Node.js v18+
  * MongoDB URI (Local ou Atlas)

### Instalação

1.  **Clone o repositório**

    ```bash
    git clone [https://github.com/MarianaFreitas02/tcc-vault.git](https://github.com/MarianaFreitas02/tcc-vault.git)
    cd tcc-vault
    ```

2.  **Instale as dependências**

    ```bash
    # Instalar dependências do Servidor
    cd server
    npm install

    # Instalar dependências do Cliente (em outro terminal)
    cd ../client
    npm install
    ```

3.  **Configuração (.env)**
    Crie um arquivo `.env` na pasta `server` com as variáveis:

    ```env
    MONGO_URI=sua_string_de_conexao_mongodb
    PORT=5000
    JWT_SECRET=uma_chave_secreta_qualquer
    ```

4.  **Rodar**

    ```bash
    # No terminal do server
    npm start

    # No terminal do client
    npm run dev
    ```

-----

\<div align="center"\>
Desenvolvido por \<a href="https://www.linkedin.com/in/ymarianafreitas/"\>Mariana Freitas\</a\>
\</div\>

```
```

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

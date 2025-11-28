// src/crypto.js - O Cérebro Matemático do TCC

// 1. Converte texto/buffer para Base64 (para enviar na rede)
export function bufferParaBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
  
// 2. Converte Base64 de volta para Buffer (para usar na criptografia)
export function base64ParaBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// 3. O Liquidificador (Senha + Sal = Chave Mestra)
export async function derivarChaveMestra(senha, saltBase64) {
    const encoder = new TextEncoder();
    
    // Se o salt vier como string Base64, converte. Se não, gera um novo.
    let salt;
    if (saltBase64) {
        salt = base64ParaBuffer(saltBase64);
    } else {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
    }

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", encoder.encode(senha), { name: "PBKDF2" }, false, ["deriveKey"]
    );

    const key = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, 
      { name: "AES-GCM", length: 256 }, 
      true, // Importante: true para podermos exportar bytes para criar o Hash de Auth
      ["encrypt", "decrypt"]
    );

    return { key, salt: bufferParaBase64(salt) };
}

// 4. Cria o "Crachá" de Autenticação (Hash da Chave Mestra)
// O servidor recebe isso para dizer "OK", mas não consegue reverter para a Chave Mestra.
export async function gerarHashDeAutenticacao(chaveMestra) {
    const rawKey = await window.crypto.subtle.exportKey("raw", chaveMestra);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", rawKey);
    return bufferParaBase64(hashBuffer);
}
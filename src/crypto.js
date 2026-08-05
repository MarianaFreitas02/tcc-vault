/**
 * NEXUS VAULT - MOTOR CRIPTOGRÁFICO TÁTICO
 * Baseado em Web Crypto API para arquitetura Zero-Knowledge
 */

// ✅ CORREÇÃO: Converte Buffer para Base64 usando processamento em blocos para evitar Stack Overflow
export function bufferParaBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  const chunk = 8192; // Processa 8KB por vez em vez de tudo de uma vez

  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, len)));
  }
  return btoa(binary);
}

// Converte Base64 de volta para Buffer
export function base64ParaBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * DERIVAÇÃO DE CHAVE MESTRA (PBKDF2)
 * Transforma a Seed Phrase de 12 palavras em uma chave AES-256
 */
export async function derivarChaveMestra(seedPhrase, saltBase64) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(seedPhrase.trim().toLowerCase());
  const saltBuffer = base64ParaBuffer(saltBase64);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000, 
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, 
    ['encrypt', 'decrypt']
  );

  return { key };
}

/**
 * GERA HASH DE AUTENTICAÇÃO
 * Prova de conhecimento da chave sem revelá-la ao servidor
 */
export async function gerarHashDeAutenticacao(key) {
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', exportedKey);
  return bufferParaBase64(hashBuffer);
}

/**
 * CIFRAGEM AES-256-GCM
 * Criptografia autenticada localmente
 */
export async function criptografarDado(chaveMestra, dadoOriginal) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  // Verifica se o dado é string ou buffer (importante para arquivos)
  const dadoBuffer = typeof dadoOriginal === 'string' 
    ? encoder.encode(dadoOriginal) 
    : dadoOriginal;

  const conteudoCifrado = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    chaveMestra,
    dadoBuffer
  );

  return {
    iv: bufferParaBase64(iv),
    conteudo: bufferParaBase64(conteudoCifrado)
  };
}

/**
 * DECIFRAGEM AES-256-GCM
 */
export async function descriptografarDado(chaveMestra, ivBase64, conteudoBase64) {
  const iv = base64ParaBuffer(ivBase64);
  const conteudo = base64ParaBuffer(conteudoBase64);

  const decifradoBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    chaveMestra,
    conteudo
  );

  return decifradoBuffer;
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao, bufferParaBase64 } from '../crypto';
import Logo from '../components/Logo';
import { ShieldCheck, AlertCircle, Copy } from 'lucide-react';
import '../App.css';

const dicionario = ["alfa", "bravo", "codigo", "dados", "elo", "fogo", "gato", "hora", "item", "jato", "kilo", "livro", "mapa", "nó", "ovo", "pato", "queijo", "rede", "sol", "trem", "uva", "vela", "web", "xadrez", "zebra", "nuvem", "cripto", "nexus", "seguro", "chave"];

export default function CadastroWallet() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState([]);
  const [status, setStatus] = useState("");
  const API_URL = "https://accessnexus.com.br/api";

  function gerarNovaSeed() {
    const novaSeed = [];
    for (let i = 0; i < 12; i++) {
      const index = window.crypto.getRandomValues(new Uint32Array(1))[0] % dicionario.length;
      novaSeed.push(dicionario[index]);
    }
    setSeed(novaSeed);
    setStatus("");
  }

async function finalizarCadastro() {
    setStatus("⏳ PROCESSANDO...");
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = bufferParaBase64(salt);
      const { key } = await derivarChaveMestra(seed.join(" "), saltBase64);
      const authHash = await gerarHashDeAutenticacao(key);

      // GERAÇÃO DE ID ÚNICO INFALÍVEL
      const idGerado = "nexus_" + Date.now(); 

      const resposta = await fetch(`${API_URL}/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: idGerado, 
            salt: saltBase64, 
            authHash: authHash 
        })
      });

      if (resposta.ok) {
        alert(`✅ SUCESSO!\n\nID DO COFRE: ${idGerado}\n\nANOTE ESTE ID PARA LOGAR!`);
        navigate('/');
      } else {
        const erroData = await resposta.json();
        setStatus("❌ " + erroData.erro);
      }
    } catch (e) {
      setStatus("❌ Erro de conexão.");
    }
  }

  return (
    <div className="tactical-layout login-page">
      <div className="login-box tactical-theme">
        <Logo size={60} />
        <h1 style={{ color: '#00ff41', marginBottom: '20px' }}>GERAR CREDENCIAL</h1>
        {seed.length === 0 ? (
          <button className="btn-action" onClick={gerarNovaSeed}>[ GERAR 12 PALAVRAS ]</button>
        ) : (
          <>
            <div className="grid-seed">{seed.map((p, i) => (<div key={i} className="seed-word"><span>{i + 1}</span>{p}</div>))}</div>
            <button className="btn-action" style={{borderColor: '#222', color: '#888', marginBottom: '10px'}} onClick={() => {
              navigator.clipboard.writeText(seed.join(" "));
              setStatus("📋 Frase copiada!");
            }}><Copy size={16} /> COPIAR FRASE</button>
            <button className="btn-action" onClick={finalizarCadastro}><ShieldCheck size={18} /> [ ATIVAR COFRE ]</button>
          </>
        )}
        <p style={{ color: '#00ff41', marginTop: '15px' }}>{status}</p>
        <button onClick={() => navigate('/')} className="link-back">VOLTAR</button>
      </div>
    </div>
  );
}
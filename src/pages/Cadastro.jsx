// src/pages/Cadastro.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf"; // <--- Importando a lib de PDF
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import '../App.css';

function Cadastro() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("");
  const [contaCriada, setContaCriada] = useState(false); // Novo estado para controlar a tela
  const navigate = useNavigate();

  // --- FUNÇÃO 1: CRIAR CONTA (BACKEND) ---
  async function handleCadastro() {
    if (!username || !senha) return setStatus("Preencha tudo!");
    if (senha.length < 6) return setStatus("Senha muito curta (min 6).");
    
    setStatus("⏳ Gerando chaves criptográficas...");

    try {
      const { key, salt } = await derivarChaveMestra(senha, null);
      const authHash = await gerarHashDeAutenticacao(key);

      const payload = { username, salt, authHash };

      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setContaCriada(true); // Muda a tela para mostrar o botão de download
        setStatus("✅ Conta criada! Agora baixe seu Kit de Emergência.");
      } else {
        setStatus("❌ " + dados.erro);
      }

    } catch (error) {
      console.error(error);
      setStatus("Erro técnico ao criar chaves.");
    }
  }

  // --- FUNÇÃO 2: GERAR E BAIXAR PDF (CLIENT-SIDE) ---
  function baixarKitEmergencia() {
    const doc = new jsPDF();

    // Design simples do PDF
    doc.setFontSize(22);
    doc.setTextColor(220, 53, 69); // Vermelho
    doc.text("KIT DE EMERGENCIA - SECURE VAULT", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Preto
    doc.text("Guarde este documento em um local seguro (HD Externo ou Impresso).", 20, 30);
    doc.text("Se voce esquecer sua senha, este eh o unico jeito de recuperar.", 20, 36);
    
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45); // Linha horizontal

    doc.setFontSize(16);
    doc.text(`Usuario: ${username}`, 20, 60);
    
    doc.setFontSize(16);
    // Nota: Em um app real, evitamos imprimir a senha, mas para o Kit de Resgate é necessário.
    doc.text(`Senha Mestra: ${senha}`, 20, 75);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Criado em: ${new Date().toLocaleString()}`, 20, 100);
    doc.text("Tecnologia: Zero-Knowledge Encryption (AES-256)", 20, 110);

    // Salvar o arquivo no computador do usuário
    doc.save(`SecureVault_Kit_Emergencia_${username}.pdf`);
  }

  function irParaLogin() {
    navigate('/login');
  }

  // --- RENDERIZAÇÃO ---
  return (
    <div className="container" style={{maxWidth: '450px'}}>
      
      {!contaCriada ? (
        // TELA 1: FORMULÁRIO DE CADASTRO
        <>
          <div className="header">
            <span className="icon-lock">📝</span>
            <h1>Criar Conta</h1>
            <p>Cofre Zero-Knowledge</p>
          </div>

          <div className="form-group">
            <label>Usuário</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Senha Mestra (Não esqueça!)</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} />
          </div>

          <button className="btn-encrypt" style={{width: '100%'}} onClick={handleCadastro}>
            Registrar
          </button>
        </>
      ) : (
        // TELA 2: SUCESSO E DOWNLOAD
        <div style={{textAlign: 'center'}}>
          <div className="header">
            <span className="icon-lock" style={{color: '#10b981'}}>✅</span>
            <h1 style={{color: '#10b981'}}>Sucesso!</h1>
            <p>Sua conta foi criada.</p>
          </div>

          <div style={{background: '#334155', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ef4444'}}>
            <h4 style={{color: '#ef4444', marginTop: 0}}>⚠️ IMPORTANTE</h4>
            <p style={{fontSize: '0.9rem', color: '#cbd5e1'}}>
              Nós não sabemos sua senha. Se você esquecer, perderá todos os arquivos.
              <br/><br/>
              <strong>Baixe o Kit de Emergência abaixo e salve em um Pen Drive ou HD Externo.</strong>
            </p>
          </div>

          <button 
            className="btn-decrypt" 
            style={{width: '100%', marginBottom: '10px', background: '#e11d48'}} 
            onClick={baixarKitEmergencia}
          >
            📄 Baixar Kit de Emergência (PDF)
          </button>

          <button 
            className="btn-encrypt" 
            style={{width: '100%', background: 'transparent', border: '1px solid #3b82f6'}} 
            onClick={irParaLogin}
          >
            Já salvei, ir para Login ➡️
          </button>
        </div>
      )}

      <p className="status-box" style={{background: 'transparent', color: 'white'}}>
        {status}
      </p>

      {!contaCriada && (
        <p style={{textAlign: 'center', marginTop: '20px', fontSize: '0.8rem'}}>
          <a href="/login" style={{color: '#3b82f6'}}>Já tem conta? Faça Login</a>
        </p>
      )}
    </div>
  );
}

export default Cadastro;
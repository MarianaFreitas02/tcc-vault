import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import '../App.css';

function Cadastro() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("");
  const [contaCriada, setContaCriada] = useState(false);
  const navigate = useNavigate();

  // URL DO SEU BACKEND NO RENDER
  const API_URL = "https://tcc-backend-4ept.onrender.com";

  async function handleCadastro() {
    if (!username || !senha) return setStatus("Preencha tudo!");
    if (senha.length < 6) return setStatus("Senha muito curta (min 6).");
    
    setStatus("⏳ Gerando chaves criptográficas...");

    try {
      const { key, salt } = await derivarChaveMestra(senha, null);
      const authHash = await gerarHashDeAutenticacao(key);

      const payload = { username, salt, authHash };

      const resposta = await fetch(`${API_URL}/api/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setContaCriada(true);
        setStatus("✅ Conta criada! Agora baixe seu Kit de Emergência.");
      } else {
        setStatus("❌ " + dados.erro);
      }

    } catch (error) {
      console.error(error);
      setStatus("Erro técnico ao criar chaves.");
    }
  }

  function baixarKitEmergencia() {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(220, 53, 69);
    doc.text("KIT DE EMERGENCIA - SECURE VAULT", 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Guarde este documento em um local seguro.", 20, 30);
    doc.text("Se voce esquecer sua senha, este eh o unico jeito de recuperar.", 20, 36);
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);
    doc.setFontSize(16);
    doc.text(`Usuario: ${username}`, 20, 60);
    doc.text(`Senha Mestra: ${senha}`, 20, 75);
    doc.save(`SecureVault_Kit_Emergencia_${username}.pdf`);
  }

  function irParaLogin() {
    navigate('/login');
  }

  return (
    <div className="container" style={{maxWidth: '450px'}}>
      {!contaCriada ? (
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
            <label>Senha Mestra</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} />
          </div>
          <button className="btn-encrypt" style={{width: '100%'}} onClick={handleCadastro}>
            Registrar
          </button>
        </>
      ) : (
        <div style={{textAlign: 'center'}}>
          <div className="header">
            <span className="icon-lock" style={{color: '#10b981'}}>✅</span>
            <h1 style={{color: '#10b981'}}>Sucesso!</h1>
            <p>Sua conta foi criada.</p>
          </div>
          <div style={{background: '#334155', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
            <h4 style={{color: '#ef4444', marginTop: 0}}>⚠️ IMPORTANTE</h4>
            <p style={{fontSize: '0.9rem', color: '#cbd5e1'}}>
              Baixe o Kit de Emergência abaixo. Sem ele, você perde tudo se esquecer a senha.
            </p>
          </div>
          <button className="btn-decrypt" style={{width: '100%', marginBottom: '10px', background: '#e11d48'}} onClick={baixarKitEmergencia}>
            📄 Baixar Kit de Emergência
          </button>
          <button className="btn-encrypt" style={{width: '100%', background: 'transparent', border: '1px solid #3b82f6'}} onClick={irParaLogin}>
            Ir para Login ➡️
          </button>
        </div>
      )}
      <p className="status-box" style={{background: 'transparent', color: 'white'}}>{status}</p>
      {!contaCriada && <p style={{textAlign: 'center', marginTop: '20px'}}><a href="/login" style={{color: '#3b82f6'}}>Já tem conta? Login</a></p>}
    </div>
  );
}

export default Cadastro;
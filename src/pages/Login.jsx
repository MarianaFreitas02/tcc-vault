import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import '../App.css';

export default function Login() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const API_URL = "https://tcc-backend-4ept.onrender.com"; 

  async function handleLogin() {
    if (!username || !senha) return setStatus("⚠️ Credenciais vazias");
    setStatus("⏳ Autenticando...");

    try {
      const respSalt = await fetch(`${API_URL}/api/auth/salt/${username}`);
      if (!respSalt.ok) return setStatus("❌ Usuário não encontrado");
      
      const { salt } = await respSalt.json();
      const { key } = await derivarChaveMestra(senha, salt);
      const authHash = await gerarHashDeAutenticacao(key);

      const resposta = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authHash })
      });

      if (resposta.ok) {
        navigate('/dashboard', { state: { chaveMestra: key, usuario: username } });
      } else {
        setStatus("⛔ Senha incorreta");
      }
    } catch (error) {
      setStatus("Erro de Conexão");
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box" style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        
        <div style={{marginBottom: '30px'}}>
          <h1 className="glitch" style={{margin: 0, fontSize: '3rem', color: 'white', letterSpacing: '2px'}}>NEXUS</h1>
          <p style={{color: '#00ff41', letterSpacing: '4px', fontSize: '0.8rem', marginTop: '5px'}}>SYSTEM ACCESS</p>
        </div>

        <div style={{width: '100%', maxWidth: '300px'}}>
          <label style={{color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px'}}>IDENTIFICAÇÃO</label>
          <input 
            type="text" 
            placeholder="CODINOME" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            style={{textAlign: 'center', fontSize: '1.1rem'}} 
          />
        </div>

        <div style={{width: '100%', maxWidth: '300px', marginTop: '15px'}}>
          <label style={{color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px'}}>CHAVE DE ACESSO</label>
          <input 
            type="password" 
            placeholder="••••••" 
            value={senha} 
            onChange={e => setSenha(e.target.value)}
            style={{textAlign: 'center', letterSpacing: '3px', fontSize: '1.1rem'}} 
          />
        </div>

        <button 
          className="btn-action" 
          style={{width: '100%', maxWidth: '300px', marginTop: '25px', borderRadius: '4px'}} 
          onClick={handleLogin}
        >
          [ INICIAR SESSÃO ]
        </button>

        <p style={{marginTop: '20px', color: status.includes('❌') ? '#ff4444' : '#00ff41', height: '20px', fontSize: '0.9rem'}}>
          {status}
        </p>
        
        <div style={{marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px', width: '100%'}}>
          <a href="/cadastro" style={{color: '#666', textDecoration: 'none', fontSize: '0.8rem', textTransform: 'uppercase'}}>
            Solicitar Nova Credencial
          </a>
        </div>
      </div>
    </div>
  );
}
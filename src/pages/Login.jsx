import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import '../App.css';

function Login() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  // URL DO SEU BACKEND NO RENDER
  const API_URL = "https://tcc-backend-4ept.onrender.com"; 

  async function handleLogin() {
    if (!username || !senha) return setStatus("Digite usuário e senha.");
    setStatus("⏳ Buscando credenciais...");

    try {
      const respSalt = await fetch(`${API_URL}/api/auth/salt/${username}`);
      
      if (!respSalt.ok) {
        return setStatus("❌ Usuário não encontrado.");
      }
      
      const { salt } = await respSalt.json();

      setStatus("🔐 Processando criptografia...");

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
        setStatus("⛔ Senha incorreta!");
      }

    } catch (error) {
      console.error(error);
      setStatus("Erro de conexão.");
    }
  }

  return (
    <div className="container" style={{maxWidth: '400px'}}>
      <div className="header">
        <span className="icon-lock">🔐</span>
        <h1>Acessar Cofre</h1>
        <p>Login Seguro</p>
      </div>

      <div className="form-group">
        <label>Usuário</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
      </div>

      <div className="form-group">
        <label>Senha Mestra</label>
        <input type="password" value={senha} onChange={e => setSenha(e.target.value)} />
      </div>

      <button className="btn-encrypt" style={{width: '100%'}} onClick={handleLogin}>
        Entrar
      </button>

      <p className="status-box" style={{background: 'transparent', color: 'white'}}>
        {status}
      </p>

      <p style={{textAlign: 'center', marginTop: '20px', fontSize: '0.8rem'}}>
        <a href="/cadastro" style={{color: '#3b82f6'}}>Criar nova conta</a>
      </p>
    </div>
  );
}

export default Login;
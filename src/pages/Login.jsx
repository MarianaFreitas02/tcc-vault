// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import '../App.css';

function Login() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    if (!username || !senha) return setStatus("Digite usuário e senha.");
    setStatus("⏳ Buscando credenciais...");

    try {
      // 1. Pedir o SALT do usuário para o servidor
      // Sem o salt, não conseguimos recriar a chave matemática.
      const respSalt = await fetch(`http://localhost:3000/api/auth/salt/${username}`);
      
      if (!respSalt.ok) {
        return setStatus("❌ Usuário não encontrado.");
      }
      
      const { salt } = await respSalt.json();

      setStatus("🔐 Processando criptografia...");

      // 2. ZK Flow: Recriar a Chave Mestra usando a senha e o Salt que veio do banco
      const { key } = await derivarChaveMestra(senha, salt);

      // 3. Gerar o Hash de Autenticação para provar quem somos
      const authHash = await gerarHashDeAutenticacao(key);

      // 4. Tentar Logar
      const respLogin = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authHash })
      });

      if (respLogin.ok) {
        // SUCESSO!
        // Aqui está o segredo: Passamos a 'key' (Chave Mestra) para a próxima tela via memória.
        // Se o usuário der F5 no Dashboard, ele perde essa chave (Segurança máxima).
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
        <input 
          type="text" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label>Senha Mestra</label>
        <input 
          type="password" 
          value={senha} 
          onChange={e => setSenha(e.target.value)} 
        />
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
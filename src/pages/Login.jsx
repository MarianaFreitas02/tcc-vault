import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto'; // Importando sua criptografia

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // O Hook que faz o redirecionamento

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // 1. Pergunta pro servidor: "Qual o sal desse usuário?"
      // Nota: Use caminho relativo (/api) para funcionar na Vercel e Localhost
      const resSalt = await fetch(`/api/auth/salt/${username}`);
      
      if (!resSalt.ok) {
        if (resSalt.status === 404) throw new Error('Usuário não encontrado');
        throw new Error('Erro ao buscar usuário');
      }

      const { salt } = await resSalt.json();

      // 2. A MÁGICA ZERO-KNOWLEDGE (No navegador)
      // Recria a chave mestra usando a senha digitada + o salt que veio do banco
      const { key } = await derivarChaveMestra(password, salt);
      
      // Gera o hash de autenticação (só isso vai pra rede)
      const authHash = await gerarHashDeAutenticacao(key);

      // 3. Tenta Logar enviando o Hash (nunca a senha!)
      const resLogin = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authHash })
      });

      const data = await resLogin.json();

      if (!resLogin.ok) {
        // Se for erro 429 (Bloqueio do SIEM), mostramos a mensagem especial
        throw new Error(data.erro || 'Falha no login');
      }

      // === AQUI ESTAVA O PROBLEMA ===
      // 4. Salvar o Token e Redirecionar
      localStorage.setItem('token', data.token); // Grava o "crachá"
      localStorage.setItem('usuario', username); // Grava o nome pra usar depois
      
      // Agora o App.jsx vai deixar entrar!
      navigate('/dashboard'); 

    } catch (err) {
      console.error(err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{color: '#fff', marginBottom: '20px'}}>Acessar Cofre</h2>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Usuário (RA)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Senha Mestra"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          
          {erro && <div style={styles.erro}>{erro}</div>}
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Validando Criptografia...' : 'Entrar'}
          </button>
        </form>

        <p style={{marginTop: '20px', color: '#888'}}>
          Não tem conta? <Link to="/cadastro" style={{color: '#4CAF50'}}>Criar agora</Link>
        </p>
      </div>
    </div>
  );
}

// Estilos simples para não quebrar o layout
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212', color: 'white' },
  card: { background: '#1e1e1e', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #333', background: '#2c2c2c', color: 'white', fontSize: '16px' },
  button: { padding: '12px', borderRadius: '6px', border: 'none', background: '#4CAF50', color: 'white', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  erro: { color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', padding: '10px', borderRadius: '4px', fontSize: '14px' }
};
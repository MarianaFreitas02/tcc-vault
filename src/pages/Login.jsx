import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importante: useNavigate
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto'; // Sua criptografia

export default function Login() {
  // --- ESTADOS ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- NAVEGAÇÃO ---
  const navigate = useNavigate();

  // --- FUNÇÃO DE LOGIN (Lógica do TCC) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // 1. Busca o Sal (Salt) do usuário no Banco
      const resSalt = await fetch(`/api/auth/salt/${username}`);
      
      if (!resSalt.ok) {
        if (resSalt.status === 404) throw new Error('Usuário não encontrado');
        throw new Error('Erro de conexão com o servidor');
      }

      const { salt } = await resSalt.json();

      // 2. Criptografia Zero-Knowledge (Front-end)
      // O navegador calcula a chave e o hash. A senha nunca sai daqui limpa.
      const { key } = await derivarChaveMestra(password, salt);
      const authHash = await gerarHashDeAutenticacao(key);

      // 3. Tenta Logar enviando apenas o Hash
      const resLogin = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authHash })
      });

      const data = await resLogin.json();

      if (!resLogin.ok) {
        // Se for erro 429 (Bloqueio do SIEM), mostra a mensagem de segurança
        throw new Error(data.erro || 'Falha no login');
      }

      // 4. SUCESSO! Salva o token e redireciona
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', username);
      
      // REDIRECIONA PARA O DASHBOARD
      navigate('/dashboard'); 

    } catch (err) {
      console.error(err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // MANTENHA O SEU "return (...)" EXATAMENTE COMO ESTAVA ABAIXO
  // NÃO APAGUE O SEU HTML/LAYOUT
  // ---------------------------------------------------------
  return (
    // ... aqui começa o seu layout original ...
    // Certifique-se apenas que o seu <form> tem: onSubmit={handleLogin}
    // E os inputs têm: value={username} e value={password}
    
    <div className="login-container"> 
       {/* Cole o seu layout original aqui se ele sumiu, 
           ou apenas mantenha o que você já tinha no arquivo */}
       
       {/* Exemplo genérico caso precise recuperar: */}
       <form onSubmit={handleLogin}>
          {/* Seus inputs e botões originais */}
       </form>
    </div>
  );
}
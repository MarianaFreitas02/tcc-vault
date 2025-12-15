import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import './App.css';

// --- COMPONENTE VIGIA (Monitora Inatividade) ---
function AutoLogout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // TEMPO LIMITE: 5 Minutos (em milissegundos)
  // Para testar rápido, mude para 10000 (10 segundos)
  const TIMEOUT_MS = 5 * 60 * 1000; 

  useEffect(() => {
    // Não faz sentido deslogar quem já está no login ou cadastro
    const paginasPublicas = ['/', '/login', '/cadastro'];
    if (paginasPublicas.includes(location.pathname)) return;

    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      
      timer = setTimeout(() => {
        // Ação quando o tempo esgota
        console.log("🔒 Inatividade detectada. Bloqueando sistema...");
        alert("⚠️ SESSÃO EXPIRADA\n\nPor segurança, sua sessão foi encerrada devido à inatividade.");
        navigate('/login');
      }, TIMEOUT_MS);
    };

    // Lista de eventos que resetam o timer (provam que o usuário está lá)
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Adiciona os ouvintes
    eventos.forEach(evento => window.addEventListener(evento, resetTimer));

    // Inicia a contagem assim que entra na página
    resetTimer();

    // Limpeza (quando muda de página ou componente morre)
    return () => {
      if (timer) clearTimeout(timer);
      eventos.forEach(evento => window.removeEventListener(evento, resetTimer));
    };
  }, [location.pathname, navigate]);

  return null; // Este componente não renderiza nada na tela
}

function App() {
  return (
    <Router>
      {/* O componente AutoLogout fica aqui dentro para ter acesso ao Router */}
      <AutoLogout />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
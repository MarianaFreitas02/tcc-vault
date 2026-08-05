import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import Logo from '../components/Logo';
import { KeyRound, Lock, Loader2, ShieldAlert } from 'lucide-react';
import '../App.css';

/**
 * TELA DE CARREGAMENTO (FEEDBACK VISUAL)
 */
function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 600);
          return 100;
        }
        return Math.min(old + 10, 100);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="loading-overlay" style={{backgroundColor: '#000', position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999}}>
      <Logo size={100} />
      <h1 style={{fontSize: '4rem', color: '#00ff41', textShadow: '0 0 20px #00ff41'}}>{progress}%</h1>
      <p style={{color: '#00ff41', letterSpacing: '4px', fontSize: '0.8rem'}}>DESCRIPTOGRAFANDO CAMADA DE ACESSO...</p>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  
  // Estados para credenciais
  const [username, setUsername] = useState(""); // O ID (ex: nexus_123456)
  const [seedPhrase, setSeedPhrase] = useState("");
  
  // Estados de controle
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  
  const API_URL = "https://accessnexus.com.br/api";

  async function handleConnect(e) {
    e.preventDefault();
    
    // Usando o nome correto do estado que você definiu: username
    if (!username) return setStatus("⚠️ INSIRA O ID DO SEU COFRE.");
    if (seedPhrase.trim().split(/\s+/).length < 12) return setStatus("⚠️ SEED INVÁLIDA.");

    setIsAuthenticating(true);
    try {
      // CORREÇÃO AQUI: mudado de usernameDigitado para username
      const respSalt = await fetch(`${API_URL}/auth/salt/${username.trim()}`);
      const dataSalt = await respSalt.json();

      if (!respSalt.ok) {
        setStatus("❌ ID NÃO ENCONTRADO.");
        setIsAuthenticating(false);
        return;
      }

      const { key } = await derivarChaveMestra(seedPhrase.trim().toLowerCase(), dataSalt.salt);
      const authHash = await gerarHashDeAutenticacao(key);

      const resp = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), authHash })
      });

      if (resp.ok) {
        setSessionData({ chaveMestra: key, usuario: username.trim() });
        setIsLoading(true); // Isso vai disparar o LoadingScreen e navegar para o dashboard
      } else {
        setStatus("❌ FRASE MNEMÔNICA INCORRETA.");
        setIsAuthenticating(false);
      }
    } catch (e) {
      console.error(e);
      setStatus("❌ ERRO DE COMUNICAÇÃO COM O SERVIDOR.");
      setIsAuthenticating(false);
    }
  }

  return (
    <div className="tactical-layout login-page">
      {isLoading ? (
        <LoadingScreen onComplete={() => navigate('/dashboard', { state: sessionData })} />
      ) : (
        <div className="login-box tactical-theme">
          <div className="login-header-group" style={{textAlign: 'center', marginBottom: '20px'}}>
            <Logo size={60} />
            <h1 style={{marginTop: '15px', letterSpacing: '3px', fontSize: '1.2rem', color: '#fff'}}>NEXUS ACCESS</h1>
          </div>
          
          <form onSubmit={handleConnect} style={{ width: '100%' }}>
            {/* NOVO CAMPO DE ID */}
            <div className="input-group">
              <label style={{fontSize: '0.7rem', color: '#004411'}}>ID DO COFRE</label>
              <input 
                className="tactical-input" 
                type="text"
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: nexus_123456"
                autoComplete="off"
              />
            </div>

            <div className="input-group" style={{marginTop: '15px'}}>
              <label style={{fontSize: '0.7rem', color: '#004411'}}><KeyRound size={14}/> SEED PHRASE [BIP-39]</label>
              <textarea 
                className="tactical-input" 
                rows="4" 
                value={seedPhrase} 
                onChange={(e) => setSeedPhrase(e.target.value)}
                placeholder="Digite as 12 palavras separadas por espaço..."
              />
            </div>

            <button type="submit" className="btn-action" disabled={isAuthenticating} style={{marginTop: '20px'}}>
              {isAuthenticating ? <Loader2 className="spinner" /> : <><Lock size={16}/> [ RECONECTAR ]</>}
            </button>
          </form>

          <div className="warning-box">
            <ShieldAlert size={20} />
            <p>O Nexus não armazena sua semente. O ID é público, mas o acesso depende exclusivamente das suas 12 palavras.</p>
          </div>

          <button onClick={() => navigate('/cadastro')} className="link-back">
            {">>"} NÃO TEM ACESSO? GERAR NOVA SEED
          </button>

          <p style={{ color: '#00ff41', marginTop: '15px', fontSize: '0.8rem', textAlign: 'center' }}>{status}</p>
        </div>
      )}
    </div>
  );
}
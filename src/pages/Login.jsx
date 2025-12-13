import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import PatternLock from '../components/PatternLock';
import Logo from '../components/Logo';
import '../App.css';
import { Lock, Hash, Type, Grid, User, Eye, EyeOff } from 'lucide-react';

// --- COMPONENTE DE LOADING TÁTICO ---
function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("INICIANDO PROTOCOLO...");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((old) => {
        const increment = Math.floor(Math.random() * 15) + 1; 
        const newProgress = old + increment;

        if (newProgress > 30 && newProgress < 50) setMsg("VERIFICANDO INTEGRIDADE...");
        if (newProgress > 50 && newProgress < 80) setMsg("DESCRIPTOGRAFANDO COFRE...");
        if (newProgress > 80 && newProgress < 99) setMsg("LIBERANDO ACESSO...");

        if (newProgress >= 100) {
          clearInterval(interval);
          setMsg("ACESSO AUTORIZADO");
          setTimeout(onComplete, 800); 
          return 100;
        }
        return newProgress;
      });
    }, 150); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#020202', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace", color: '#00ff41'
    }}>
      <div style={{ marginBottom: '40px', transform: 'scale(1.5)' }}>
        <Logo size={100} />
      </div>
      <h1 style={{ 
        fontSize: '5rem', margin: '0', 
        textShadow: '0 0 20px rgba(0, 255, 65, 0.5)' 
      }}>
        {progress}%
      </h1>
      <div style={{ 
        width: '300px', height: '4px', background: '#111', 
        marginTop: '20px', borderRadius: '2px', overflow: 'hidden' 
      }}>
        <div style={{ 
          width: `${progress}%`, height: '100%', 
          background: '#00ff41', 
          boxShadow: '0 0 10px #00ff41',
          transition: 'width 0.2s linear' 
        }} />
      </div>
      <p style={{ 
        marginTop: '20px', letterSpacing: '3px', fontSize: '0.9rem', 
        opacity: 0.8, textTransform: 'uppercase' 
      }}>
        {msg}
      </p>
    </div>
  );
}

export default function Login() {
  const [metodo, setMetodo] = useState('cpf'); 
  const [identificacao, setIdentificacao] = useState("");
  const [segredo, setSegredo] = useState("");
  const [status, setStatus] = useState("");
  
  // ESTADOS NOVOS
  const [isLoading, setIsLoading] = useState(false);
  const [dadosLoginSucesso, setDadosLoginSucesso] = useState(null); 
  const [mostrarSenha, setMostrarSenha] = useState(false); // Controle do olho

  const navigate = useNavigate();
  const API_URL = "https://tcc-vault.vercel.app"; 

  const trocarMetodo = (m) => {
    setMetodo(m);
    setStatus("");
    setSegredo("");
    setMostrarSenha(false); // Reseta o olho ao trocar de aba
  };

  const handleCpfChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setIdentificacao(v);
  };

  async function handleLogin(segredoFinal = segredo) {
    if (!identificacao) return setStatus("⚠️ Identificação necessária.");
    if (!segredoFinal) return setStatus("⚠️ Senha/Padrão vazio.");
    
    setStatus("⏳ PROCESSANDO...");

    try {
      const cpfReal = identificacao.replace(/\D/g, "");
      
      let usernameComSufixo = cpfReal;
      if (metodo === 'pin') usernameComSufixo += "_pin";
      if (metodo === 'frase') usernameComSufixo += "_frase";
      if (metodo === 'pattern') usernameComSufixo += "_pattern";

      const respSalt = await fetch(`${API_URL}/api/auth/salt/${usernameComSufixo}`);
      
      if (!respSalt.ok) {
        return setStatus(`❌ Método ${metodo.toUpperCase()} não cadastrado.`);
      }
      
      const { salt } = await respSalt.json();
      const { key } = await derivarChaveMestra(segredoFinal, salt);
      const authHash = await gerarHashDeAutenticacao(key);

      const resposta = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameComSufixo, authHash })
      });

      if (resposta.ok) {
        setDadosLoginSucesso({ chaveMestra: key, usuario: usernameComSufixo });
        setIsLoading(true);
      } else {
        setStatus("⛔ NEGADO: Credenciais Inválidas.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Erro de Conexão.");
    }
  }

  const finalizarLogin = () => {
    navigate('/dashboard', { state: dadosLoginSucesso });
  };

  const irParaCadastro = () => {
    let metodoDestino = 'senha';
    if (metodo === 'pin') metodoDestino = 'pin';
    if (metodo === 'frase') metodoDestino = 'frase';
    if (metodo === 'pattern') metodoDestino = 'pattern';
    navigate('/cadastro', { state: { metodoInicial: metodoDestino } });
  };

  const renderInputSegredo = () => {
    switch (metodo) {
      case 'cpf':
        return (
          <div className="input-group" style={{position: 'relative'}}>
            <label>SENHA DE ACESSO</label>
            <input 
              type={mostrarSenha ? "text" : "password"} // Alterna tipo
              placeholder="••••••••" 
              value={segredo} 
              onChange={e => setSegredo(e.target.value)} 
            />
            {/* Ícone de Olho */}
            <button 
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{
                position: 'absolute', right: '10px', top: '38px', 
                background: 'none', border: 'none', color: '#666', cursor: 'pointer'
              }}
            >
              {mostrarSenha ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        );
      case 'pin':
        return (
          <div className="input-group" style={{position: 'relative'}}>
            <label>PIN DE SEGURANÇA</label>
            <input 
              type={mostrarSenha ? "tel" : "password"} // PIN também esconde
              maxLength="8" 
              placeholder="0000" 
              value={segredo} 
              onChange={e => setSegredo(e.target.value.replace(/\D/g,''))} 
              style={{
                fontSize: '1.5rem', letterSpacing: '10px', textAlign: 'center'
              }} 
            />
            <button 
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{
                position: 'absolute', right: '10px', top: '38px', 
                background: 'none', border: 'none', color: '#666', cursor: 'pointer'
              }}
            >
              {mostrarSenha ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        );
      case 'frase':
        return (
          <div className="input-group" style={{position: 'relative'}}>
            <label>FRASE DE SEGURANÇA</label>
            {/* Frase usamos input normal se quiser esconder, ou textarea se quiser ver. 
                Geralmente frase se vê, mas vou deixar opção de esconder se preferir. */}
            <textarea 
              rows="3" 
              placeholder="Ex: cavalo bateria correto" 
              value={segredo} 
              onChange={e => setSegredo(e.target.value)} 
              style={{
                width: '100%', background: '#050505', border: '1px solid #333', 
                color: '#00ff41', padding: '10px', 
                // Se quiser esconder a frase (opcional, meio estranho em textarea mas funciona com blur)
                //filter: mostrarSenha ? 'none' : 'blur(4px)' 
              }} 
            />
             {/* Frase geralmente não precisa de 'password type', mas se quiser me avise */}
          </div>
        );
      case 'pattern':
        return (
          <div className="input-group" style={{alignItems: 'center'}}>
            <label style={{marginBottom: '15px'}}>PADRÃO DE DESBLOQUEIO</label>
            <PatternLock onComplete={(padrao) => handleLogin(padrao)} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="login-wrapper">
      {isLoading && <LoadingScreen onComplete={finalizarLogin} />}

      <div className="login-box" style={{maxWidth: '500px'}}>
        <div style={{marginBottom: '20px'}}>
          <Logo size={60} />
          <h1 style={{fontSize: '1.5rem', marginTop: '10px'}}>NEXUS ACCESS</h1>
          <p style={{letterSpacing: '2px'}}>SELECIONE O MÉTODO DE AUTENTICAÇÃO</p>
        </div>

        <div className="auth-tabs">
          <button className={metodo === 'cpf' ? 'active' : ''} onClick={() => trocarMetodo('cpf')} title="Senha Padrão"><User size={20}/></button>
          <button className={metodo === 'pin' ? 'active' : ''} onClick={() => trocarMetodo('pin')} title="PIN Numérico"><Hash size={20}/></button>
          <button className={metodo === 'frase' ? 'active' : ''} onClick={() => trocarMetodo('frase')} title="Frase Secreta"><Type size={20}/></button>
          <button className={metodo === 'pattern' ? 'active' : ''} onClick={() => trocarMetodo('pattern')} title="Padrão"><Grid size={20}/></button>
        </div>

        <div className="input-group">
          <label>IDENTIFICAÇÃO (CPF)</label>
          <input type="text" placeholder="000.000.000-00" value={identificacao} onChange={handleCpfChange} maxLength={14} style={{fontWeight: 'bold'}} />
        </div>

        {renderInputSegredo()}

        {metodo !== 'pattern' && (
          <button className="btn-action" style={{marginTop: '20px'}} onClick={() => handleLogin()}>[ AUTENTICAR ]</button>
        )}

        <p style={{marginTop: '20px', color: status.includes('❌') || status.includes('⛔') ? '#ff3333' : '#00ff41', minHeight: '20px', fontSize: '0.8rem'}}>{status}</p>
        
        <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px'}}>
          <button onClick={irParaCadastro} className="link-back" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', color: '#666', textDecoration: 'underline'}}>
            SOLICITAR CREDENCIAL (MODO {metodo.toUpperCase()})
          </button>
        </div>
      </div>
    </div>
  );
}
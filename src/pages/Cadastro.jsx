import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import Logo from '../components/Logo';
import PatternLock from '../components/PatternLock';
import '../App.css';
import { Lock, Hash, Grid, Type, Eye, EyeOff } from 'lucide-react';

export default function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // LÊ O ESTADO QUE VEIO DO LOGIN
  const [metodo, setMetodo] = useState(location.state?.metodoInicial || "senha");
  
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState("");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [pin, setPin] = useState("");
  const [confirmarPin, setConfirmarPin] = useState("");
  const [frase, setFrase] = useState("");
  const [padrao, setPadrao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const API_URL = "https://tcc-backend-4ept.onrender.com"; 

  const handleCpfChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  async function handleCadastro() {
    let segredoFinal = "";

    if (!cpf || cpf.length < 14) return setStatus("⚠️ CPF inválido.");

    if (metodo === 'senha') {
      if (senha !== confirmarSenha) return setStatus("⚠️ Senhas não conferem.");
      if (senha.length < 8) return setStatus("⚠️ Mínimo 8 caracteres.");
      segredoFinal = senha;
    } 
    else if (metodo === 'pin') {
      if (pin !== confirmarPin) return setStatus("⚠️ PINs não conferem.");
      if (pin.length < 4) return setStatus("⚠️ Mínimo 4 números.");
      segredoFinal = pin;
    } 
    else if (metodo === 'frase') {
      if (!frase || frase.split(' ').length < 2) return setStatus("⚠️ Mínimo 2 palavras.");
      segredoFinal = frase;
    }
    else if (metodo === 'pattern') {
      if (padrao.length < 7) return setStatus("⚠️ Padrão muito curto.");
      segredoFinal = padrao;
    }

    setStatus("⏳ CRIPTOGRAFANDO...");

    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { key } = await derivarChaveMestra(segredoFinal, saltHex);
      const authHash = await gerarHashDeAutenticacao(key);
      const cpfLimpo = cpf.replace(/\D/g, "");

      // ROTA CORRIGIDA: /register
      const resposta = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cpfLimpo, authHash, salt: saltHex })
      });

      if (resposta.ok) {
        setStatus("✅ SUCESSO! REDIRECIONANDO...");
        setTimeout(() => navigate('/login'), 1500);
      } else {
        const erro = await resposta.json();
        if (erro.erro && erro.erro.includes('já existe')) {
          setStatus("⛔ ERRO: CPF JÁ CADASTRADO.");
        } else {
          setStatus(`⛔ ${erro.erro || 'Falha no registro'}`);
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Falha de Conexão.");
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box" style={{maxWidth: '550px'}}>
        <div style={{marginBottom: '10px'}}>
          <Logo size={50} />
          <h1 style={{fontSize: '1.5rem', marginTop: '15px'}}>NOVO REGISTRO</h1>
          <p style={{letterSpacing: '2px', fontSize: '0.7rem'}}>
            MODO SELECIONADO: <span style={{color: '#00ff41'}}>{metodo.toUpperCase()}</span>
          </p>
        </div>

        <div className="auth-tabs">
          <button className={metodo === 'senha' ? 'active' : ''} onClick={() => setMetodo('senha')} title="Senha"><Lock size={18}/></button>
          <button className={metodo === 'pin' ? 'active' : ''} onClick={() => setMetodo('pin')} title="PIN"><Hash size={18}/></button>
          <button className={metodo === 'frase' ? 'active' : ''} onClick={() => setMetodo('frase')} title="Frase"><Type size={18}/></button>
          <button className={metodo === 'pattern' ? 'active' : ''} onClick={() => setMetodo('pattern')} title="Padrão"><Grid size={18}/></button>
        </div>

        <div className="input-group">
          <label>IDENTIFICAÇÃO (CPF)</label>
          <input type="text" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} maxLength={14} style={{fontWeight: 'bold', color: '#00ff41'}} />
        </div>

        {metodo === 'senha' && (
          <>
            <div className="input-group" style={{position: 'relative'}}>
              <label>SENHA FORTE</label>
              <input type={mostrarSenha ? "text" : "password"} placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', color: '#666', cursor: 'pointer'}}>{mostrarSenha ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <div className="input-group"><label>CONFIRMAR SENHA</label><input type="password" placeholder="••••••••" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} style={{borderColor: senha && confirmarSenha && senha !== confirmarSenha ? '#ff3333' : ''}} /></div>
          </>
        )}

        {metodo === 'pin' && (
          <>
            <div className="input-group"><label>PIN NUMÉRICO</label><input type="tel" placeholder="0000" maxLength={8} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,''))} style={{textAlign: 'center', letterSpacing: '15px', fontSize: '1.5rem'}} /></div>
            <div className="input-group"><label>CONFIRMAR PIN</label><input type="tel" placeholder="0000" maxLength={8} value={confirmarPin} onChange={e => setConfirmarPin(e.target.value.replace(/\D/g,''))} style={{textAlign: 'center', letterSpacing: '15px', fontSize: '1.5rem', borderColor: pin && confirmarPin && pin !== confirmarPin ? '#ff3333' : ''}} /></div>
          </>
        )}

        {metodo === 'frase' && (
          <div className="input-group">
            <label>FRASE MEMORIZÁVEL</label>
            <textarea rows="3" placeholder="Ex: cavalo bateria grampo correto" value={frase} onChange={e => setFrase(e.target.value)} style={{width: '100%', background: '#050505', border: '1px solid #333', color: '#00ff41', padding: '15px', fontFamily: 'inherit', fontSize: '1.1rem'}} />
          </div>
        )}

        {metodo === 'pattern' && (
          <div className="input-group" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <label style={{marginBottom: '15px'}}>DESENHE SEU PADRÃO</label>
            <PatternLock onComplete={(p) => { setPadrao(p); setStatus("⚠️ Padrão capturado. Clique em REGISTRAR."); }} />
          </div>
        )}

        <button className="btn-action" onClick={handleCadastro} style={{marginTop: '20px'}}>[ REGISTRAR ]</button>
        <p style={{marginTop: '15px', color: status.includes('✅') ? '#00ff41' : (status.includes('⏳') ? '#ffff00' : '#ff3333'), minHeight: '20px', fontSize: '0.85rem'}}>{status}</p>
        <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px'}}>
          <a href="/login" className="link-back">{'<'} VOLTAR</a>
        </div>
      </div>
    </div>
  );
}
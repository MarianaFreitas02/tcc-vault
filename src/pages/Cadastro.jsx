import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { derivarChaveMestra, gerarHashDeAutenticacao } from '../crypto';
import Logo from '../components/Logo';
import PatternLock from '../components/PatternLock';
import '../App.css';
import { Lock, Hash, Grid, Type, Eye, EyeOff, Check, X } from 'lucide-react';

// Função auxiliar para calcular força da senha (0 a 4)
function calcularForcaSenha(senha) {
  let score = 0;
  if (!senha) return 0;

  if (senha.length >= 8) score += 1; // Tamanho
  if (/[A-Z]/.test(senha)) score += 1; // Maiúscula
  if (/[0-9]/.test(senha)) score += 1; // Número
  if (/[^A-Za-z0-9]/.test(senha)) score += 1; // Especial (!@#)

  return score; // Retorna 0, 1, 2, 3 ou 4
}

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf == '') return false;
  if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  if (rev != parseInt(cpf.charAt(9))) return false;

  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  if (rev != parseInt(cpf.charAt(10))) return false;

  return true;
}

export default function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [metodo, setMetodo] = useState(location.state?.metodoInicial || "senha");
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState("");

  const [senha, setSenha] = useState("");
  const [forcaSenha, setForcaSenha] = useState(0); // Estado novo para a força
  
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [pin, setPin] = useState("");
  const [confirmarPin, setConfirmarPin] = useState("");
  const [frase, setFrase] = useState("");
  const [padrao, setPadrao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);


  const API_URL = "https://nexus-access.vercel.app";

  const trocarMetodo = (novoMetodo) => {
    setMetodo(novoMetodo);
    setStatus(""); 
  };

  const handleCpfChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  // Atualiza a força sempre que a senha muda
  const handleSenhaChange = (e) => {
    const val = e.target.value;
    setSenha(val);
    setForcaSenha(calcularForcaSenha(val));
  };

  async function handleCadastro() {
    let segredoFinal = "";
    let sufixo = ""; 

    if (!cpf) return setStatus("⚠️ Digite o CPF.");
    if (!validarCPF(cpf)) return setStatus("⛔ ERRO: CPF inválido.");

    if (metodo === 'senha') {
      if (!senha || !confirmarSenha) return setStatus("⚠️ Preencha a senha.");
      if (senha !== confirmarSenha) return setStatus("⚠️ Senhas não conferem.");
      
      // NOVA VALIDAÇÃO DE FORÇA
      if (forcaSenha < 3) return setStatus("⚠️ A senha é muito fraca. Melhore-a.");
      
      segredoFinal = senha;
      sufixo = ""; 
    } 
    else if (metodo === 'pin') {
      if (pin !== confirmarPin) return setStatus("⚠️ PINs não conferem.");
      if (pin.length < 4) return setStatus("⚠️ Mínimo 4 números.");
      segredoFinal = pin;
      sufixo = "_pin";
    } 
    else if (metodo === 'frase') {
      if (!frase || frase.split(' ').length < 2) return setStatus("⚠️ Mínimo 2 palavras.");
      segredoFinal = frase;
      sufixo = "_frase";
    }
    else if (metodo === 'pattern') {
      if (!padrao || padrao.length < 5) return setStatus("⚠️ Padrão muito curto.");
      segredoFinal = padrao;
      sufixo = "_pattern";
    }

    setStatus("⏳ CRIPTOGRAFANDO...");

    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { key } = await derivarChaveMestra(segredoFinal, saltHex);
      const authHash = await gerarHashDeAutenticacao(key);
      
      const cpfReal = cpf.replace(/\D/g, "");
      const usernameComSufixo = cpfReal + sufixo;

      const resposta = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: usernameComSufixo, 
          authHash, 
          salt: saltHex 
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setStatus("✅ SUCESSO! REDIRECIONANDO...");
        setTimeout(() => navigate('/login'), 1500);
      } else {
        if (dados.erro && dados.erro.includes('já cadastrado')) {
           setStatus(`⛔ CPF JÁ POSSUI ${metodo.toUpperCase()} CADASTRADO.`);
        } else {
           setStatus(`⛔ ERRO: ${dados.erro || 'Falha desconhecida'}`);
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Falha de Conexão com o Servidor.");
    }
  }

  // Cores da barra de força
  const getCorForca = () => {
    if (forcaSenha <= 1) return '#ff3333'; // Vermelho (Fraca)
    if (forcaSenha === 2) return '#ffff00'; // Amarelo (Média)
    if (forcaSenha >= 3) return '#00ff41'; // Verde (Forte)
    return '#333';
  };

  const getTextoForca = () => {
    if (forcaSenha === 0) return "";
    if (forcaSenha <= 1) return "FRACA";
    if (forcaSenha === 2) return "MÉDIA";
    if (forcaSenha >= 3) return "SEGURA";
    return "";
  };

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
          <button className={metodo === 'senha' ? 'active' : ''} onClick={() => trocarMetodo('senha')} title="Senha"><Lock size={18}/></button>
          <button className={metodo === 'pin' ? 'active' : ''} onClick={() => trocarMetodo('pin')} title="PIN"><Hash size={18}/></button>
          <button className={metodo === 'frase' ? 'active' : ''} onClick={() => trocarMetodo('frase')} title="Frase"><Type size={18}/></button>
          <button className={metodo === 'pattern' ? 'active' : ''} onClick={() => trocarMetodo('pattern')} title="Padrão"><Grid size={18}/></button>
        </div>

        <div className="input-group">
          <label>IDENTIFICAÇÃO (CPF)</label>
          <input type="text" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} maxLength={14} style={{fontWeight: 'bold', color: '#00ff41'}} />
        </div>

        {metodo === 'senha' && (
          <>
            <div className="input-group" style={{position: 'relative'}}>
              <label>CRIAR SENHA FORTE</label>
              <input 
                type={mostrarSenha ? "text" : "password"} 
                placeholder="Senha..." 
                value={senha} 
                onChange={handleSenhaChange} 
                style={{borderColor: getCorForca()}} // Borda muda de cor
              />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', color: '#666', cursor: 'pointer'}}>{mostrarSenha ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              
              {/* BARRA DE FORÇA VISUAL */}
              {senha.length > 0 && (
                <div style={{marginTop: '5px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <div style={{flex: 1, height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden'}}>
                    <div style={{
                      width: `${(forcaSenha / 4) * 100}%`, 
                      height: '100%', 
                      background: getCorForca(),
                      transition: 'width 0.3s, background 0.3s'
                    }} />
                  </div>
                  <span style={{fontSize: '0.7rem', color: getCorForca(), fontWeight: 'bold'}}>{getTextoForca()}</span>
                </div>
              )}
              
              {/* Dicas só aparecem se a senha for fraca */}
              {forcaSenha < 3 && senha.length > 0 && (
                <div style={{fontSize: '0.7rem', color: '#666', marginTop: '5px', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px'}}>
                  <span style={{color: senha.length >= 8 ? '#00ff41' : '#666'}}>{senha.length >= 8 ? '✓' : '•'} Mínimo 8 chars</span>
                  <span style={{color: /[A-Z]/.test(senha) ? '#00ff41' : '#666'}}>{/[A-Z]/.test(senha) ? '✓' : '•'} Maiúscula</span>
                  <span style={{color: /[0-9]/.test(senha) ? '#00ff41' : '#666'}}>{/[0-9]/.test(senha) ? '✓' : '•'} Número</span>
                  <span style={{color: /[^A-Za-z0-9]/.test(senha) ? '#00ff41' : '#666'}}>{/[^A-Za-z0-9]/.test(senha) ? '✓' : '•'} Símbolo</span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>CONFIRMAR SENHA</label>
              <input type="password" placeholder="Repita a senha..." value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} style={{borderColor: senha && confirmarSenha && senha !== confirmarSenha ? '#ff3333' : ''}} />
            </div>
          </>
        )}

        {/* ... (Os outros métodos PIN, FRASE, PADRÃO continuam iguais abaixo) ... */}
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
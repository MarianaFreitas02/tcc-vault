import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bufferParaBase64, base64ParaBuffer } from '../crypto';
import AIChatBox from '../components/AIChatBox';
import Logo from '../components/Logo';
import '../App.css';
import { 
  Lock, FileText, Folder, HardDrive, 
  Plus, Terminal, Trash2, UploadCloud, 
  Film, Image as ImageIcon, Music, Key, Shuffle, Copy, Globe, User
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chaveMestra, usuario } = location.state || {};

  const [listaItens, setListaItens] = useState([]);
  
  // NAVEGAÇÃO
  const [secaoAtual, setSecaoAtual] = useState('cofre'); // 'cofre' ou 'gerador'
  const [filtro, setFiltro] = useState('todos'); // todos, texto, arquivo, midia, senha
  
  // MODAIS E DRAG & DROP
  const [modalNovo, setModalNovo] = useState(false);
  const [modalVer, setModalVer] = useState(null);
  const [abaForm, setAbaForm] = useState('arquivo'); // arquivo, texto, senha
  const [isDragging, setIsDragging] = useState(false);
  
  // DADOS DO FORMULÁRIO DE CRIAÇÃO
  const [titulo, setTitulo] = useState("");
  const [conteudoTexto, setConteudoTexto] = useState(""); // Para Texto
  const [arquivo, setArquivo] = useState(null); // Para Arquivos/Midia
  
  // ESTADOS PARA SENHA (NOVO)
  const [urlSite, setUrlSite] = useState("");
  const [usuarioSite, setUsuarioSite] = useState("");
  const [senhaSite, setSenhaSite] = useState("");

  // ESTADOS DO GERADOR DE SENHA
  const [senhaGerada, setSenhaGerada] = useState("");
  const [tamanhoSenha, setTamanhoSenha] = useState(16);

  const API_URL = "https://tcc-vault.vercel.app"; // Lembre-se do .env se preferir

  useEffect(() => {
    if (!chaveMestra) navigate('/login');
    else carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const res = await fetch(`${API_URL}/api/meus-arquivos/${usuario}`);
      const dados = await res.json();
      setListaItens(dados);
    } catch (e) { console.error("Erro Conexão Tática"); }
  }

  // --- LÓGICA DE FILTRAGEM INTELIGENTE ---
  const itensVisiveis = listaItens.filter(item => {
    const tipo = item.tipoArquivo;

    if (filtro === 'todos') return true;
    
    if (filtro === 'texto') return tipo === 'secret/text';
    
    if (filtro === 'senha') return tipo === 'secret/password';

    if (filtro === 'midia') {
      return tipo.startsWith('image/') || tipo.startsWith('video/') || tipo.startsWith('audio/');
    }

    if (filtro === 'arquivo') {
      // Arquivo é tudo que NÃO é texto, NÃO é senha e NÃO é mídia
      const isTexto = tipo === 'secret/text';
      const isSenha = tipo === 'secret/password';
      const isMidia = tipo.startsWith('image/') || tipo.startsWith('video/') || tipo.startsWith('audio/');
      return !isTexto && !isSenha && !isMidia;
    }

    return true;
  });

  // --- DRAG & DROP ---
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { 
    e.preventDefault(); 
    if (e.currentTarget.contains(e.relatedTarget)) return; 
    setIsDragging(false); 
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setArquivo(file);
      setTitulo(file.name);
      setAbaForm('arquivo');
      setModalNovo(true);
      setSecaoAtual('cofre');
    }
  };

  // --- GERADOR DE SENHAS ---
  const gerarSenha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]";
    let pass = "";
    for (let i = 0; i < tamanhoSenha; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenhaGerada(pass);
  };

  const copiarSenha = () => {
    navigator.clipboard.writeText(senhaGerada);
    alert("Senha copiada para a área de transferência!");
  };

  const salvarSenhaGerada = () => {
    setTitulo("Nova Senha");
    setSenhaSite(senhaGerada);
    setAbaForm('senha');
    setSecaoAtual('cofre');
    setModalNovo(true);
  };

  // --- CRUD ---
  async function handleSalvar() {
    if (!titulo) return alert("ERRO: Identificador ausente.");
    let bytes, mime;

    // Lógica para preparar os dados antes de criptografar
    if (abaForm === 'arquivo') {
      if (!arquivo) return alert("ERRO: Arquivo não selecionado.");
      bytes = await arquivo.arrayBuffer();
      mime = arquivo.type;
    } 
    else if (abaForm === 'texto') {
      if (!conteudoTexto) return alert("ERRO: Conteúdo vazio.");
      bytes = new TextEncoder().encode(conteudoTexto);
      mime = 'secret/text';
    }
    else if (abaForm === 'senha') {
      if (!senhaSite) return alert("ERRO: Senha vazia.");
      // Transforma o objeto JSON da senha em bytes para criptografar
      const dadosSenha = JSON.stringify({
        site: urlSite,
        user: usuarioSite,
        pass: senhaSite
      });
      bytes = new TextEncoder().encode(dadosSenha);
      mime = 'secret/password';
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cifrado = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, chaveMestra, bytes);
    
    await fetch(`${API_URL}/api/salvar`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        dono: usuario, 
        nomeOriginal: titulo,
        tipoArquivo: mime,
        iv: bufferParaBase64(iv),
        conteudo: bufferParaBase64(cifrado)
      })
    });
    
    // Limpeza
    setModalNovo(false); setTitulo(""); setConteudoTexto(""); setArquivo(null); 
    setUrlSite(""); setUsuarioSite(""); setSenhaSite("");
    carregarDados();
  }

  async function handleExcluir(e, id) {
    e.stopPropagation();
    const confirmar = window.confirm("Tem certeza que deseja DELETAR PERMANENTEMENTE?");
    if (!confirmar) return;
    try {
        const res = await fetch(`${API_URL}/api/arquivo/${id}`, { method: 'DELETE' });
        if (res.ok) setListaItens(listaItens.filter(item => item._id !== id));
    } catch (e) { alert("Erro de conexão."); }
  }

  async function abrirItem(id) {
    try {
      const res = await fetch(`${API_URL}/api/arquivo/${id}`);
      const item = await res.json();
      const iv = base64ParaBuffer(item.iv);
      const cifrado = base64ParaBuffer(item.conteudo);
      const decifrado = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, chaveMestra, cifrado);
      
      if (item.tipoArquivo === 'secret/text') {
        const texto = new TextDecoder().decode(decifrado);
        setModalVer({ ...item, conteudoReal: texto, tipo: 'texto' });
      } 
      else if (item.tipoArquivo === 'secret/password') {
        const jsonString = new TextDecoder().decode(decifrado);
        const dadosSenha = JSON.parse(jsonString);
        setModalVer({ ...item, dadosSenha, tipo: 'senha' });
      }
      else {
        const url = URL.createObjectURL(new Blob([decifrado], { type: item.tipoArquivo }));
        setModalVer({ ...item, url, tipo: 'arquivo' });
      }
    } catch (e) {
      alert("FALHA DE SEGURANÇA: Chave inválida ou dados corrompidos.");
    }
  }

  const cpfVisual = usuario ? usuario.split('_')[0].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "UNKNOWN";

  // Ícone dinâmico do card
  const getIcon = (tipo) => {
    if (tipo === 'secret/text') return <FileText size={14} />;
    if (tipo === 'secret/password') return <Key size={14} />;
    if (tipo.startsWith('image/')) return <ImageIcon size={14} />;
    if (tipo.startsWith('video/')) return <Film size={14} />;
    if (tipo.startsWith('audio/')) return <Music size={14} />;
    return <Folder size={14} />;
  }

  return (
    <div className="tactical-layout" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragging && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          border: '4px dashed #00ff41', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
        }}>
          <UploadCloud size={100} color="#00ff41" />
          <h1 style={{color: '#00ff41'}}>DETECTADO ARQUIVO EXTERNO</h1>
        </div>
      )}

      <aside className="tactical-sidebar">
        <div className="brand-box">
          <Logo size={42} />
          <div className="brand-text">
            <h1>SECURE_VAULT</h1>
            <span>GOV.SYSTEM.V2</span>
          </div>
        </div>

        <div className="nav-section">
          <p className="nav-label">DIRETÓRIOS</p>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'todos' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('todos')}}>
            <HardDrive size={18} /> [ RAIZ ]
          </button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'texto' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('texto')}}>
            <FileText size={18} /> [ TEXTOS ]
          </button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'arquivo' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('arquivo')}}>
            <Folder size={18} /> [ ARQUIVOS ]
          </button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'midia' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('midia')}}>
            <Film size={18} /> [ MÍDIA ]
          </button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'senha' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('senha')}}>
            <Key size={18} /> [ SENHAS ]
          </button>
        </div>

        <div className="nav-section">
          <p className="nav-label">UTILITÁRIOS</p>
          <button className={`nav-btn ${secaoAtual==='gerador' ? 'active' : ''}`} onClick={() => setSecaoAtual('gerador')}>
            <Shuffle size={18} /> [ GERADOR DE SENHA ]
          </button>
        </div>

        <div className="system-info">
          <p>STATUS: <span className="status-ok">ONLINE</span></p>
          <p>AGENTE: {cpfVisual}</p>
          <button onClick={() => navigate('/login')} className="btn-logout">[ DESCONECTAR ]</button>
        </div>
      </aside>

      <main className="tactical-main">
        {secaoAtual === 'cofre' ? (
          <>
            <header className="main-header">
              <div className="path-display">/HOME/{cpfVisual}/{filtro.toUpperCase()}/</div>
              <button className="btn-add" onClick={() => setModalNovo(true)}><Plus size={16} /> NOVA ENTRADA</button>
            </header>
            <div className="data-grid">
              {itensVisiveis.map(item => (
                <div key={item._id} className="data-card" onClick={() => abrirItem(item._id)}>
                  <div className="card-header">
                    <span className="file-id">ID: {item._id.slice(-6).toUpperCase()}</span>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button onClick={(e) => handleExcluir(e, item._id)} className="btn-delete-card" style={{background:'none', border:'none', color:'#ff3333'}}><Trash2 size={16} /></button>
                      {getIcon(item.tipoArquivo)}
                    </div>
                  </div>
                  <div className="card-body"><h3>{item.nomeOriginal}</h3></div>
                  <div className="card-footer"><span>{new Date(item.dataUpload).toLocaleDateString()}</span><span className="security-tag">AES-256</span></div>
                </div>
              ))}
              {itensVisiveis.length === 0 && <div className="empty-terminal"><p>{'>'} PASTA VAZIA.</p></div>}
            </div>
          </>
        ) : (
          // --- TELA DO GERADOR DE SENHA ---
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
             <div className="login-box" style={{maxWidth: '500px', width: '100%', border: '1px solid #00ff41', padding: '40px'}}>
                <h2 style={{color: '#00ff41', textAlign: 'center', marginBottom: '20px'}}>GERADOR DE CHAVES FORTES</h2>
                
                <div style={{background: '#000', border: '1px solid #333', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <span style={{fontSize: '1.2rem', fontFamily: 'monospace', color: senhaGerada ? '#fff' : '#666'}}>
                      {senhaGerada || "Clique em Gerar"}
                   </span>
                   {senhaGerada && <button onClick={copiarSenha} style={{background:'none', border:'none', color: '#00ff41', cursor: 'pointer'}} title="Copiar"><Copy /></button>}
                </div>

                <div className="input-group">
                  <label>COMPLEXIDADE (Caracteres: {tamanhoSenha})</label>
                  <input type="range" min="8" max="64" value={tamanhoSenha} onChange={(e) => setTamanhoSenha(e.target.value)} style={{width: '100%', accentColor: '#00ff41'}} />
                </div>

                <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                  <button className="btn-action" onClick={gerarSenha} style={{flex: 1}}><Shuffle size={16}/> GERAR NOVA</button>
                  {senhaGerada && <button className="btn-action" onClick={salvarSenhaGerada} style={{flex: 1, background: '#333'}}><Key size={16}/> SALVAR NO COFRE</button>}
                </div>
             </div>
          </div>
        )}
      </main>
      <AIChatBox />
      
      {/* MODAL NOVO REGISTRO */}
      {modalNovo && (
        <div className="modal-screen">
          <div className="modal-window">
            <div className="modal-title"><h3>{'>'} NOVA ENTRADA SEGURA</h3><button onClick={() => setModalNovo(false)}>X</button></div>
            <div className="type-selector">
              <button className={abaForm==='arquivo' ? 'selected' : ''} onClick={()=>setAbaForm('arquivo')}>ARQUIVO</button>
              <button className={abaForm==='texto' ? 'selected' : ''} onClick={()=>setAbaForm('texto')}>TEXTO</button>
              <button className={abaForm==='senha' ? 'selected' : ''} onClick={()=>setAbaForm('senha')}>SENHA</button>
            </div>
            
            <div className="form-group"><label>TÍTULO / SERVIÇO:</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} autoFocus placeholder={abaForm === 'senha' ? 'Ex: Facebook, Email...' : 'Ex: Relatório Final'} /></div>
            
            {abaForm === 'arquivo' && (
               <div className="form-group"><label>ARQUIVO:</label>
               {arquivo ? <div style={{color: '#00ff41', border: '1px solid #00ff41', padding: '10px'}}>{arquivo.name}</div> : <input type="file" onChange={e=>{setArquivo(e.target.files[0]); if(e.target.files[0]) setTitulo(e.target.files[0].name)}} />}
               </div>
            )}
            {abaForm === 'texto' && (
               <div className="form-group"><label>CONTEÚDO:</label><textarea rows="5" value={conteudoTexto} onChange={e=>setConteudoTexto(e.target.value)} /></div>
            )}
            {abaForm === 'senha' && (
               <>
                 <div className="form-group"><label>URL / SITE:</label><div style={{display:'flex', alignItems:'center', borderBottom:'1px solid #333'}}><Globe size={16} color="#666"/><input value={urlSite} onChange={e=>setUrlSite(e.target.value)} placeholder="https://..." style={{border:'none'}}/></div></div>
                 <div className="form-group"><label>USUÁRIO / EMAIL:</label><div style={{display:'flex', alignItems:'center', borderBottom:'1px solid #333'}}><User size={16} color="#666"/><input value={usuarioSite} onChange={e=>setUsuarioSite(e.target.value)} placeholder="usuario@email.com" style={{border:'none'}}/></div></div>
                 <div className="form-group"><label>SENHA:</label><div style={{display:'flex', alignItems:'center', borderBottom:'1px solid #333'}}><Key size={16} color="#666"/><input value={senhaSite} onChange={e=>setSenhaSite(e.target.value)} placeholder="••••••••" style={{border:'none'}}/></div></div>
               </>
            )}

            <button className="btn-execute" onClick={handleSalvar}>[ CRIPTOGRAFAR E SALVAR ]</button>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR */}
      {modalVer && (
        <div className="modal-screen" onClick={()=>setModalVer(null)}>
          <div className="modal-window view" onClick={e=>e.stopPropagation()}>
             <div className="modal-title"><h3>{'>'} DADO DESCRIPTOGRAFADO</h3><button onClick={()=>setModalVer(null)}>X</button></div>
            <div className="view-container">
              {modalVer.tipo === 'texto' && <pre className="code-view">{modalVer.conteudoReal}</pre>}
              
              {modalVer.tipo === 'senha' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px'}}>
                  <div><label style={{color:'#666', fontSize:'0.8rem'}}>SERVIÇO:</label><h2 style={{color:'#00ff41', margin:0}}>{modalVer.nomeOriginal}</h2></div>
                  <div><label style={{color:'#666', fontSize:'0.8rem'}}>URL:</label><p style={{color:'#fff', margin:0}}>{modalVer.dadosSenha.site || '-'}</p></div>
                  <div><label style={{color:'#666', fontSize:'0.8rem'}}>USUÁRIO:</label><p style={{color:'#fff', margin:0}}>{modalVer.dadosSenha.user || '-'}</p></div>
                  <div style={{background: '#111', padding: '10px', border: '1px dashed #333', display: 'flex', justifyContent: 'space-between'}}>
                    <span style={{fontFamily: 'monospace', fontSize: '1.2rem'}}>{modalVer.dadosSenha.pass}</span>
                    <button onClick={() => {navigator.clipboard.writeText(modalVer.dadosSenha.pass); alert('Copiado!')}} style={{background:'none', border:'none', color:'#00ff41', cursor:'pointer'}}><Copy size={18}/></button>
                  </div>
                </div>
              )}
              
              {modalVer.tipo === 'arquivo' && (
                 modalVer.tipoArquivo.includes('image') ? <img src={modalVer.url} className="img-view" /> : 
                 modalVer.tipoArquivo.includes('video') ? <video src={modalVer.url} controls className="img-view" /> :
                 <a href={modalVer.url} download={modalVer.nomeOriginal} className="link-download">[ BAIXAR ARQUIVO ]</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
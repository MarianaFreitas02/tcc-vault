import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bufferParaBase64, base64ParaBuffer } from '../crypto';
import AIChatBox from '../components/AIChatBox';
import Logo from '../components/Logo';
import '../App.css';
import { 
  Lock, FileText, Folder, HardDrive, 
  Plus, Trash2, UploadCloud, 
  Film, Image as ImageIcon, Music, Key, Shuffle, Copy, Globe, User, ExternalLink, Search, 
  Cpu, Activity, ShieldAlert, Skull // <--- NOVOS ÍCONES
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chaveMestra, usuario } = location.state || {};

  const [listaItens, setListaItens] = useState([]);
  
  // NAVEGAÇÃO & BUSCA
  const [secaoAtual, setSecaoAtual] = useState('cofre'); // cofre, gerador, sistema
  const [filtro, setFiltro] = useState('todos'); 
  const [termoBusca, setTermoBusca] = useState(""); 
  
  // MODAIS
  const [modalNovo, setModalNovo] = useState(false);
  const [modalVer, setModalVer] = useState(null);
  const [abaForm, setAbaForm] = useState('arquivo'); 
  const [isDragging, setIsDragging] = useState(false);
  
  // DADOS FORM
  const [titulo, setTitulo] = useState("");
  const [conteudoTexto, setConteudoTexto] = useState(""); 
  const [arquivo, setArquivo] = useState(null); 
  const [urlSite, setUrlSite] = useState("");
  const [usuarioSite, setUsuarioSite] = useState("");
  const [senhaSite, setSenhaSite] = useState("");

  // GERADOR
  const [senhaGerada, setSenhaGerada] = useState("");
  const [tamanhoSenha, setTamanhoSenha] = useState(16);

  const API_URL = "https://nexus-access.vercel.app"; 

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

  const itensVisiveis = listaItens.filter(item => {
    const tipo = item.tipoArquivo;
    const nome = item.nomeOriginal.toLowerCase();
    const busca = termoBusca.toLowerCase();

    if (busca.length > 0 && !nome.includes(busca)) return false;

    if (filtro === 'todos') return true;
    if (filtro === 'texto') return tipo === 'secret/text';
    if (filtro === 'senha') return tipo === 'secret/password';
    if (filtro === 'midia') return tipo.startsWith('image/') || tipo.startsWith('video/') || tipo.startsWith('audio/');
    if (filtro === 'arquivo') {
      const isTexto = tipo === 'secret/text';
      const isSenha = tipo === 'secret/password';
      const isMidia = tipo.startsWith('image/') || tipo.startsWith('video/') || tipo.startsWith('audio/');
      return !isTexto && !isSenha && !isMidia;
    }
    return true;
  });

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget)) return; setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setArquivo(file); setTitulo(file.name); setAbaForm('arquivo'); setModalNovo(true); setSecaoAtual('cofre');
    }
  };

  const gerarSenha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]";
    let pass = "";
    for (let i = 0; i < tamanhoSenha; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setSenhaGerada(pass);
  };

  const handleAbrirNovo = () => {
    if (filtro === 'texto') setAbaForm('texto');
    else if (filtro === 'senha') setAbaForm('senha');
    else if (filtro === 'arquivo' || filtro === 'midia') setAbaForm('arquivo');
    else setAbaForm('arquivo');
    setModalNovo(true);
  };

  // --- AUTO-DESTRUIÇÃO ---
  async function handleAutoDestruicao() {
    const confirmar = window.confirm("⛔ PERIGO: PROTOCOLO DE AUTO-DESTRUIÇÃO!\n\nIsso apagará seu login e TODOS os arquivos permanentemente.\n\nTem certeza absoluta?");
    if (confirmar) {
      const confirmar2 = window.confirm("Última chance: Ação irreversível. Executar?");
      if (!confirmar2) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/excluir-conta/${usuario}`, { method: 'DELETE' });
        if (res.ok) { alert("💥 SISTEMA RESETADO."); navigate('/login'); }
        else { alert("Erro ao excluir."); }
      } catch (e) { alert("Erro de conexão."); }
    }
  }

  async function handleSalvar() {
    if (!titulo) return alert("ERRO: Identificador ausente.");
    let bytes, mime;
    if (abaForm === 'arquivo') {
      if (!arquivo) return alert("ERRO: Arquivo não selecionado.");
      bytes = await arquivo.arrayBuffer(); mime = arquivo.type;
    } else if (abaForm === 'texto') {
      if (!conteudoTexto) return alert("ERRO: Conteúdo vazio.");
      bytes = new TextEncoder().encode(conteudoTexto); mime = 'secret/text';
    } else if (abaForm === 'senha') {
      if (!senhaSite) return alert("ERRO: Senha vazia.");
      const dadosSenha = JSON.stringify({ site: urlSite, user: usuarioSite, pass: senhaSite });
      bytes = new TextEncoder().encode(dadosSenha); mime = 'secret/password';
    }
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cifrado = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, chaveMestra, bytes);
    
    await fetch(`${API_URL}/api/salvar`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ dono: usuario, nomeOriginal: titulo, tipoArquivo: mime, iv: bufferParaBase64(iv), conteudo: bufferParaBase64(cifrado) })
    });
    setModalNovo(false); setTitulo(""); setConteudoTexto(""); setArquivo(null); setUrlSite(""); setUsuarioSite(""); setSenhaSite(""); carregarDados();
  }

  async function handleExcluir(e, id) {
    e.stopPropagation();
    if (!window.confirm("Deletar permanentemente?")) return;
    try {
        const res = await fetch(`${API_URL}/api/arquivo/${id}`, { method: 'DELETE' });
        if (res.ok) setListaItens(listaItens.filter(item => item._id !== id));
    } catch (e) { alert("Erro conexão."); }
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
      } else if (item.tipoArquivo === 'secret/password') {
        const jsonString = new TextDecoder().decode(decifrado);
        const dadosSenha = JSON.parse(jsonString);
        setModalVer({ ...item, dadosSenha, tipo: 'senha' });
      } else {
        const url = URL.createObjectURL(new Blob([decifrado], { type: item.tipoArquivo }));
        setModalVer({ ...item, url, tipo: 'arquivo' });
      }
    } catch (e) { alert("FALHA DE SEGURANÇA: Chave inválida."); }
  }

  const cpfVisual = usuario ? usuario.split('_')[0].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "UNKNOWN";
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, border: '4px dashed #00ff41', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <UploadCloud size={100} color="#00ff41" />
          <h1 style={{color: '#00ff41'}}>SOLTE PARA IMPORTAR</h1>
        </div>
      )}

      <aside className="tactical-sidebar">
        <div className="brand-box">
          <Logo size={42} />
          <div className="brand-text"><h1>NEXUS</h1><span>SECURE.SYSTEM</span></div>
        </div>
        <div className="nav-section">
          <p className="nav-label">DIRETÓRIOS</p>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'todos' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('todos'); setTermoBusca("")}}><HardDrive size={18} /> [ RAIZ ]</button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'texto' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('texto'); setTermoBusca("")}}><FileText size={18} /> [ TEXTOS ]</button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'arquivo' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('arquivo'); setTermoBusca("")}}><Folder size={18} /> [ ARQUIVOS ]</button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'midia' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('midia'); setTermoBusca("")}}><Film size={18} /> [ MÍDIA ]</button>
          <button className={`nav-btn ${secaoAtual==='cofre' && filtro === 'senha' ? 'active' : ''}`} onClick={() => {setSecaoAtual('cofre'); setFiltro('senha'); setTermoBusca("")}}><Key size={18} /> [ SENHAS ]</button>
        </div>
        <div className="nav-section">
          <p className="nav-label">UTILITÁRIOS</p>
          <button className={`nav-btn ${secaoAtual==='gerador' ? 'active' : ''}`} onClick={() => setSecaoAtual('gerador')}><Shuffle size={18} /> [ GERADOR ]</button>
          {/* NOVA ABA: SISTEMA */}
          <button className={`nav-btn ${secaoAtual==='sistema' ? 'active' : ''}`} onClick={() => setSecaoAtual('sistema')}><Cpu size={18} /> [ SISTEMA ]</button>
        </div>
        <div className="system-info">
          <p>STATUS: <span className="status-ok">ONLINE</span></p>
          <p>AGENTE: {cpfVisual}</p>
          <button onClick={() => navigate('/login')} className="btn-logout">[ SAIR ]</button>
        </div>
      </aside>

      <main className="tactical-main">
        {secaoAtual === 'cofre' && (
          <>
            <header className="main-header" style={{gap: '15px'}}>
              <div className="path-display" style={{flex: 1}}>/VAULT/{filtro.toUpperCase()}/{termoBusca && <span style={{color: '#ffff00', marginLeft: '10px'}}>(BUSCA: "{termoBusca}")</span>}</div>
              <div className="search-bar" style={{display: 'flex', alignItems: 'center', background: '#000', border: '1px solid #333', borderRadius: '4px', padding: '5px 10px', minWidth: '250px'}}>
                <Search size={16} color="#666" style={{marginRight: '8px'}}/>
                <input type="text" placeholder={`Buscar em ${filtro}...`} value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} style={{background: 'none', border: 'none', color: '#00ff41', width: '100%', outline: 'none', fontFamily: 'monospace'}} />
              </div>
              <button className="btn-add" onClick={handleAbrirNovo}><Plus size={16} /> NOVA ENTRADA</button>
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
              {itensVisiveis.length === 0 && <div className="empty-terminal"><p>{termoBusca ? '> NENHUM RESULTADO.' : '> PASTA VAZIA.'}</p></div>}
            </div>
          </>
        )}

        {secaoAtual === 'gerador' && (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
             <div className="login-box" style={{maxWidth: '500px', width: '100%', border: '1px solid #00ff41', padding: '40px'}}>
                <h2 style={{color: '#00ff41', textAlign: 'center', marginBottom: '20px'}}>GERADOR DE CHAVES</h2>
                <div style={{background: '#000', border: '1px solid #333', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                   <span style={{fontSize: '1.2rem', fontFamily: 'monospace', color: senhaGerada ? '#fff' : '#666'}}>{senhaGerada || "Clique em Gerar"}</span>
                   {senhaGerada && <button onClick={() => {navigator.clipboard.writeText(senhaGerada); alert("Copiado!")}} style={{background:'none', border:'none', color: '#00ff41', cursor: 'pointer'}} title="Copiar"><Copy /></button>}
                </div>
                <div className="input-group">
                  <label>COMPLEXIDADE (Caracteres: {tamanhoSenha})</label>
                  <input type="range" min="8" max="64" value={tamanhoSenha} onChange={(e) => setTamanhoSenha(e.target.value)} style={{width: '100%', accentColor: '#00ff41'}} />
                </div>
                <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                  <button className="btn-action" onClick={gerarSenha} style={{flex: 1}}><Shuffle size={16}/> GERAR</button>
                  {senhaGerada && <button className="btn-action" onClick={() => {setTitulo("Nova Senha"); setSenhaSite(senhaGerada); setAbaForm('senha'); setSecaoAtual('cofre'); setModalNovo(true);}} style={{flex: 1, background: '#333'}}><Key size={16}/> SALVAR</button>}
                </div>
             </div>
          </div>
        )}

        {secaoAtual === 'sistema' && (
          // --- NOVO DASHBOARD DO SISTEMA ---
          <div style={{padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%'}}>
            <h2 style={{color: '#00ff41', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Activity /> STATUS DO SISTEMA
            </h2>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
              <div style={{background: '#050505', border: '1px solid #333', padding: '20px'}}>
                <label style={{color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '10px'}}>ARMAZENAMENTO (CRYPT)</label>
                <div style={{height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden'}}>
                  <div style={{width: '12%', height: '100%', background: '#00ff41'}}></div>
                </div>
                <p style={{color: '#fff', marginTop: '5px', textAlign: 'right', fontSize: '0.9rem'}}>12% EM USO</p>
              </div>
              <div style={{background: '#050505', border: '1px solid #333', padding: '20px'}}>
                <label style={{color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '10px'}}>INTEGRIDADE</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: '#00ff41'}}>
                   <ShieldAlert size={20} /> SISTEMA SEGURO
                </div>
                <p style={{color: '#666', marginTop: '5px', fontSize: '0.8rem'}}>Nenhuma violação detectada.</p>
              </div>
            </div>

            <h3 style={{color: '#fff', marginBottom: '15px'}}>ZONA DE PERIGO</h3>
            <div style={{background: '#1a0000', border: '1px solid #ff0000', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <div>
                 <h4 style={{color: '#ff0000', margin: 0}}>AUTO-DESTRUIÇÃO</h4>
                 <p style={{color: '#ffaaaa', fontSize: '0.8rem', margin: '5px 0 0 0'}}>Apaga permanentemente o usuário e chaves.</p>
               </div>
               <button onClick={handleAutoDestruicao} style={{background: '#ff0000', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px'}}>
                 <Skull /> EXECUTAR
               </button>
            </div>
          </div>
        )}
      </main>
      <AIChatBox />
      
      {modalNovo && (
        <div className="modal-screen">
          <div className="modal-window">
            <div className="modal-title"><h3>{'>'} NOVA ENTRADA SEGURA</h3><button onClick={() => setModalNovo(false)}>X</button></div>
            <div className="type-selector">
              {(filtro === 'todos' || filtro === 'arquivo' || filtro === 'midia') && <button className={abaForm==='arquivo' ? 'selected' : ''} onClick={()=>setAbaForm('arquivo')}>ARQUIVO</button>}
              {(filtro === 'todos' || filtro === 'texto') && <button className={abaForm==='texto' ? 'selected' : ''} onClick={()=>setAbaForm('texto')}>TEXTO</button>}
              {(filtro === 'todos' || filtro === 'senha') && <button className={abaForm==='senha' ? 'selected' : ''} onClick={()=>setAbaForm('senha')}>SENHA</button>}
            </div>
            <div className="form-group"><label>TÍTULO:</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} autoFocus /></div>
            {abaForm === 'arquivo' && (<div className="form-group"><label>FONTE:</label>{arquivo ? <div style={{color: '#00ff41', border: '1px solid #00ff41', padding: '10px'}}>{arquivo.name}</div> : <input type="file" onChange={e=>{setArquivo(e.target.files[0]); if(e.target.files[0]) setTitulo(e.target.files[0].name)}} />}</div>)}
            {abaForm === 'texto' && (<div className="form-group"><label>CONTEÚDO:</label><textarea rows="5" value={conteudoTexto} onChange={e=>setConteudoTexto(e.target.value)} /></div>)}
            {abaForm === 'senha' && (<><div className="form-group"><label>SITE:</label><div style={{display:'flex', alignItems:'center', borderBottom:'1px solid #333'}}><Globe size={16} color="#666"/><input value={urlSite} onChange={e=>setUrlSite(e.target.value)} placeholder="https://..." style={{border:'none'}}/></div></div><div className="form-group"><label>USUÁRIO:</label><div style={{display:'flex', alignItems:'center', borderBottom:'1px solid #333'}}><User size={16} color="#666"/><input value={usuarioSite} onChange={e=>setUsuarioSite(e.target.value)} placeholder="User" style={{border:'none'}}/></div></div><div className="form-group"><label>SENHA:</label><div style={{display:'flex', alignItems:'center', borderBottom:'1px solid #333'}}><Key size={16} color="#666"/><input value={senhaSite} onChange={e=>setSenhaSite(e.target.value)} placeholder="..." style={{border:'none'}}/></div></div></>)}
            <button className="btn-execute" onClick={handleSalvar}>[ SALVAR ]</button>
          </div>
        </div>
      )}

      {modalVer && (
        <div className="modal-screen" onClick={()=>setModalVer(null)}>
          <div className="modal-window view" onClick={e=>e.stopPropagation()}>
             <div className="modal-title"><h3>{'>'} DADO DESCRIPTOGRAFADO</h3><button onClick={()=>setModalVer(null)}>X</button></div>
            <div className="view-container">
              {modalVer.tipo === 'texto' && <pre className="code-view">{modalVer.conteudoReal}</pre>}
              {modalVer.tipo === 'senha' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px'}}>
                  <div><label style={{color:'#666', fontSize:'0.8rem'}}>SERVIÇO:</label><h2 style={{color:'#00ff41', margin:0}}>{modalVer.nomeOriginal}</h2></div>
                  <div><label style={{color:'#666', fontSize:'0.8rem'}}>URL:</label><div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>{modalVer.dadosSenha.site ? (<a href={modalVer.dadosSenha.site.startsWith('http') ? modalVer.dadosSenha.site : `https://${modalVer.dadosSenha.site}`} target="_blank" rel="noopener noreferrer" style={{color:'#00ff41', textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>{modalVer.dadosSenha.site} <ExternalLink size={12}/></a>) : <span style={{color: '#fff'}}>-</span>}</div></div>
                  <div><label style={{color:'#666', fontSize:'0.8rem'}}>USUÁRIO:</label><p style={{color:'#fff', margin:0}}>{modalVer.dadosSenha.user || '-'}</p></div>
                  <div style={{background: '#111', padding: '10px', border: '1px dashed #333', display: 'flex', justifyContent: 'space-between'}}><span style={{fontFamily: 'monospace', fontSize: '1.2rem'}}>{modalVer.dadosSenha.pass}</span><button onClick={() => {navigator.clipboard.writeText(modalVer.dadosSenha.pass); alert('Copiado!')}} style={{background:'none', border:'none', color:'#00ff41', cursor:'pointer'}}><Copy size={18}/></button></div>
                </div>
              )}
              {modalVer.tipo === 'arquivo' && (
                 modalVer.tipoArquivo.includes('image') ? <img src={modalVer.url} className="img-view" /> : 
                 modalVer.tipoArquivo.includes('video') ? <video src={modalVer.url} controls className="img-view" /> :
                 <a href={modalVer.url} download={modalVer.nomeOriginal} className="link-download">[ BAIXAR ]</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bufferParaBase64, base64ParaBuffer } from '../crypto';
import AIChatBox from '../components/AIChatBox';
import Logo from '../components/Logo';
import '../App.css';
import { 
  Lock, FileText, Folder, HardDrive, 
  Plus, Terminal, Trash2, UploadCloud 
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chaveMestra, usuario } = location.state || {};

  const [listaItens, setListaItens] = useState([]);
  const [filtro, setFiltro] = useState('todos'); 
  const [modalNovo, setModalNovo] = useState(false);
  const [modalVer, setModalVer] = useState(null);
  const [abaForm, setAbaForm] = useState('arquivo');
  
  // ESTADO PARA DRAG & DROP
  const [isDragging, setIsDragging] = useState(false);
  
  const [titulo, setTitulo] = useState("");
  const [conteudoTexto, setConteudoTexto] = useState("");
  const [arquivo, setArquivo] = useState(null);

  const API_URL = "https://tcc-vault.vercel.app"; 

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

  // --- FUNÇÕES DE DRAG & DROP ---
  const handleDragOver = (e) => {
    e.preventDefault(); // Impede o navegador de abrir o arquivo
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Um pequeno fix para evitar "piscar" quando passa por cima de elementos filhos
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Configura o modal automaticamente
      setArquivo(file);
      setTitulo(file.name); // Já preenche o nome
      setAbaForm('arquivo');
      setModalNovo(true);
    }
  };
  // -----------------------------

  async function handleExcluir(e, id) {
    e.stopPropagation();
    const confirmar = window.confirm("⚠️ ATENÇÃO AGENTE:\n\nTem certeza que deseja DELETAR PERMANENTEMENTE este registro?\nEssa ação não pode ser desfeita.");
    if (!confirmar) return;

    try {
        const res = await fetch(`${API_URL}/api/arquivo/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setListaItens(listaItens.filter(item => item._id !== id));
        } else {
            alert("❌ Erro ao excluir arquivo.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
  }

  const itensVisiveis = listaItens.filter(item => {
    if (filtro === 'todos') return true;
    if (filtro === 'text') return item.tipoArquivo === 'secret/text';
    return item.tipoArquivo !== 'secret/text';
  });

  async function handleSalvar() {
    if (!titulo) return alert("ERRO: Identificador ausente.");
    let bytes, mime;
    if (abaForm === 'arquivo') {
      if (!arquivo) return alert("ERRO: Arquivo não selecionado.");
      bytes = await arquivo.arrayBuffer();
      mime = arquivo.type;
    } else {
      if (!conteudoTexto) return alert("ERRO: Conteúdo vazio.");
      bytes = new TextEncoder().encode(conteudoTexto);
      mime = 'secret/text';
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
    setModalNovo(false); setTitulo(""); setConteudoTexto(""); setArquivo(null); carregarDados();
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
      } else {
        const url = URL.createObjectURL(new Blob([decifrado], { type: item.tipoArquivo }));
        setModalVer({ ...item, url, tipo: 'arquivo' });
      }
    } catch (e) {
      alert("FALHA DE SEGURANÇA: Chave inválida ou dados corrompidos.");
    }
  }

  const cpfVisual = usuario ? usuario.split('_')[0].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "UNKNOWN";

  return (
    // ADICIONEI OS EVENTOS DE DRAG AQUI NO CONTAINER PRINCIPAL
    <div 
      className="tactical-layout"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* --- OVERLAY DE DRAG & DROP --- */}
      {isDragging && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          border: '4px dashed #00ff41', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
        }}>
          <UploadCloud size={100} color="#00ff41" />
          <h1 style={{color: '#00ff41', marginTop: '20px', letterSpacing: '5px'}}>
            DETECTADO ARQUIVO EXTERNO
          </h1>
          <p style={{color: '#fff', letterSpacing: '2px'}}>SOLTE PARA CRIPTOGRAFAR</p>
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
          <button className={`nav-btn ${filtro === 'todos' ? 'active' : ''}`} onClick={() => setFiltro('todos')}><HardDrive size={18} /> [ RAIZ ]</button>
          <button className={`nav-btn ${filtro === 'text' ? 'active' : ''}`} onClick={() => setFiltro('text')}><Terminal size={18} /> [ CÓDIGOS ]</button>
          <button className={`nav-btn ${filtro === 'file' ? 'active' : ''}`} onClick={() => setFiltro('file')}><Folder size={18} /> [ ARQUIVOS ]</button>
        </div>
        <div className="system-info">
          <p>STATUS: <span className="status-ok">ONLINE</span></p>
          <p>AGENTE: {cpfVisual}</p>
          <button onClick={() => navigate('/login')} className="btn-logout">[ DESCONECTAR ]</button>
        </div>
      </aside>

      <main className="tactical-main">
        <header className="main-header">
          <div className="path-display">/HOME/USER/{cpfVisual}/VAULT/</div>
          <button className="btn-add" onClick={() => setModalNovo(true)}><Plus size={16} /> NOVA ENTRADA</button>
        </header>

        <div className="data-grid">
          {itensVisiveis.map(item => (
            <div key={item._id} className="data-card" onClick={() => abrirItem(item._id)}>
              <div className="card-header">
                <span className="file-id">ID: {item._id.slice(-6).toUpperCase()}</span>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                   <button onClick={(e) => handleExcluir(e, item._id)} className="btn-delete-card" style={{background: 'none', border: 'none', cursor: 'pointer', color: '#ff3333', padding: '0'}}>
                      <Trash2 size={16} />
                   </button>
                   {item.tipoArquivo === 'secret/text' ? <Lock size={14} /> : <FileText size={14} />}
                </div>
              </div>
              <div className="card-body"><h3>{item.nomeOriginal}</h3></div>
              <div className="card-footer"><span>{new Date(item.dataUpload).toLocaleDateString()}</span><span className="security-tag">AES-256</span></div>
            </div>
          ))}
          {itensVisiveis.length === 0 && <div className="empty-terminal"><p>{'>'} NENHUM DADO ENCONTRADO. ARRASTE UM ARQUIVO PARA COMEÇAR.</p></div>}
        </div>
      </main>
      <AIChatBox />
      
      {modalNovo && (
        <div className="modal-screen">
          <div className="modal-window">
            <div className="modal-title"><h3>{'>'} INSERIR NOVO REGISTRO</h3><button onClick={() => setModalNovo(false)}>X</button></div>
            <div className="type-selector">
              <button className={abaForm==='arquivo' ? 'selected' : ''} onClick={()=>setAbaForm('arquivo')}>BINÁRIO</button>
              <button className={abaForm==='senha' ? 'selected' : ''} onClick={()=>setAbaForm('senha')}>TEXTO</button>
            </div>
            <div className="form-group"><label>IDENTIFICADOR:</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} autoFocus /></div>
            {abaForm === 'arquivo' ? (
              <div className="form-group">
                <label>FONTE:</label>
                {/* Se veio do drag&drop, mostra o nome do arquivo, senão mostra o input file */}
                {arquivo ? <div style={{color: '#00ff41', border: '1px solid #00ff41', padding: '10px'}}>[ ARQUIVO CARREGADO: {arquivo.name} ]</div> : 
                <input type="file" onChange={e=>{setArquivo(e.target.files[0]); if(e.target.files[0]) setTitulo(e.target.files[0].name)}} style={{padding: '5px'}} />}
              </div>
            ) : (
              <div className="form-group"><label>DADOS:</label><textarea rows="5" value={conteudoTexto} onChange={e=>setConteudoTexto(e.target.value)} /></div>
            )}
            <button className="btn-execute" onClick={handleSalvar}>[ EXECUTAR ]</button>
          </div>
        </div>
      )}

      {modalVer && (
        <div className="modal-screen" onClick={()=>setModalVer(null)}>
          <div className="modal-window view" onClick={e=>e.stopPropagation()}>
             <div className="modal-title"><h3>{'>'} DESCRIPTOGRAFADO</h3><button onClick={()=>setModalVer(null)}>X</button></div>
            <div className="view-container">
              {modalVer.tipo === 'texto' ? (
                 <pre className="code-view">{modalVer.conteudoReal}</pre>
              ) : (
                 modalVer.tipoArquivo.includes('image') ? <img src={modalVer.url} className="img-view" /> : <a href={modalVer.url} download={modalVer.nomeOriginal} className="link-download">[ BAIXAR ]</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { criptografarDado, descriptografarDado } from '../crypto';
import Logo from '../components/Logo';
import { FileText, Download, Shield, Plus, Database, Activity, Settings } from 'lucide-react';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { chaveMestra, usuario } = location.state || {};
  const API_URL = "https://accessnexus.com.br/api";

  const [arquivos, setArquivos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [status, setStatus] = useState("");

  const carregarArquivos = useCallback(async () => {
    if (!usuario) return;
    try {
      const res = await fetch(`${API_URL}/meus-arquivos/${usuario}`);
      const data = await res.json();
      if (res.ok) setArquivos(data);
    } catch (e) { console.error(e); }
  }, [usuario, API_URL]);

  useEffect(() => {
    if (!chaveMestra) navigate('/', { replace: true });
    else carregarArquivos();
  }, [chaveMestra, navigate, carregarArquivos]);

  async function handleUpload() {
    if (!arquivoSelecionado || !titulo) return setStatus("⚠️ CAMPOS VAZIOS");
    setStatus("⏳ PROCESSANDO...");
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { iv, conteudo } = await criptografarDado(chaveMestra, e.target.result);
        await fetch(`${API_URL}/salvar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dono: usuario, nomeOriginal: arquivoSelecionado.name, tipoArquivo: arquivoSelecionado.type, titulo, iv, conteudo })
        });
        setModalAberto(false); carregarArquivos(); setStatus("");
      } catch (err) { setStatus("❌ FALHA"); }
    };
    reader.readAsArrayBuffer(arquivoSelecionado);
  }

  async function handleDownload(id, nome) {
    try {
      const res = await fetch(`${API_URL}/arquivo/${id}`);
      const data = await res.json();
      const dec = await descriptografarDado(chaveMestra, data.iv, data.conteudo);
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([dec]));
      a.download = nome; a.click();
    } catch (e) { alert("ERRO NA DECIFRAGEM"); }
  }

  if (!chaveMestra) return null;

  return (
    <div className="tactical-layout dashboard-page">
      <aside className="tactical-sidebar">
        <div style={{ marginBottom: '40px' }}><Logo size={45} /><h1 style={{fontSize: '1.2rem', marginTop: '10px'}}>NEXUS</h1></div>
        <nav style={{ flex: 1 }}>
          <button className="nav-btn active"><Database size={18}/> COFRE</button>
          <button className="nav-btn" onClick={() => navigate('/admin')}><Activity size={18}/> SENSOR</button>
          <button className="nav-btn"><Settings size={18}/> AJUSTES</button>
        </nav>
        <div style={{ borderTop: '1px solid #111', paddingTop: '20px' }}>
          <p style={{fontSize: '0.7rem', color: '#004411'}}><Shield size={12}/> {usuario}</p>
          <button onClick={() => navigate('/')} className="btn-action" style={{marginTop: '15px'}}> [ SAIR ] </button>
        </div>
      </aside>
      <main className="tactical-main">
        <header className="main-header">
          <div style={{color: '#004411', fontSize: '0.8rem'}}>SYSTEM://VAULT/STORAGE</div>
          <button className="btn-action" style={{width: 'auto'}} onClick={() => setModalAberto(true)}><Plus size={16}/> NOVA ENTRADA</button>
        </header>
        <section className="data-grid">
          {arquivos.map(arq => (
            <div key={arq._id} className="data-card">
              <div style={{display:'flex', justifyContent:'space-between', color: '#004411'}}><FileText size={18}/><span style={{fontSize:'0.6rem'}}>AES-256</span></div>
              <h3 style={{margin:'15px 0', fontSize:'0.9rem', color: '#fff'}}>{arq.titulo || arq.nomeOriginal}</h3>
              <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #111', paddingTop:'15px'}}>
                <span style={{color:'#222', fontSize:'0.6rem'}}>{new Date(arq.dataUpload).toLocaleDateString()}</span>
                <button onClick={() => handleDownload(arq._id, arq.nomeOriginal)} style={{background:'none', border:'none', color:'#00ff41', cursor:'pointer'}}><Download size={18}/></button>
              </div>
            </div>
          ))}
        </section>
      </main>
      {modalAberto && (
        <div className="modal-screen" style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="login-box tactical-theme" style={{width: '400px'}}>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} className="tactical-input" placeholder="TÍTULO DO ARQUIVO" />
            <input type="file" onChange={e => setArquivoSelecionado(e.target.files[0])} style={{margin: '20px 0', color: '#fff'}} />
            <button className="btn-action" onClick={handleUpload}>CRIPTOGRAFAR E ENVIAR</button>
            <button onClick={() => setModalAberto(false)} style={{marginTop: '10px', background: 'none', border: 'none', color: '#888'}}>CANCELAR</button>
            <p style={{fontSize: '0.7rem', marginTop: '10px', color: '#00ff41'}}>{status}</p>
          </div>
        </div>
      )}
    </div>
  );
}
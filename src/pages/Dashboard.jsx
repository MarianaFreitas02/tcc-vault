// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bufferParaBase64, base64ParaBuffer } from '../crypto';
import '../App.css';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { chaveMestra, usuario } = location.state || {};

  const [listaItens, setListaItens] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('arquivo');
  const [tituloItem, setTituloItem] = useState("");
  const [textoSenha, setTextoSenha] = useState("");
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [itemAberto, setItemAberto] = useState(null);
  const [status, setStatus] = useState("");

  const API_URL = "https://tcc-backend-4ept.onrender.com";

  useEffect(() => {
    if (!chaveMestra || !usuario) {
      navigate('/login', { replace: true });
    } else {
      carregarLista();
    }
  }, [chaveMestra, usuario, navigate]);

  async function carregarLista() {
    try {
      const resp = await fetch(`${API_URL}/api/meus-arquivos/${usuario}`);
      const dados = await resp.json();
      setListaItens(dados);
    } catch (error) {
      console.error("Erro ao carregar", error);
    }
  }

  const itensFiltrados = listaItens.filter(item => {
    if (filtro === 'todos') return true;
    if (filtro === 'texto') return item.tipoArquivo === 'secret/text';
    if (filtro === 'arquivo') return item.tipoArquivo !== 'secret/text';
    return true;
  });

  async function handleSalvar() {
    if (!tituloItem) return alert("Dê um título para este item!");
    setStatus("Criptografando...");
    
    try {
      let bytesParaCifrar;
      let tipoMime;

      if (abaAtiva === 'arquivo') {
        if (!arquivoSelecionado) return alert("Selecione um arquivo!");
        const reader = new FileReader();
        bytesParaCifrar = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsArrayBuffer(arquivoSelecionado);
        });
        tipoMime = arquivoSelecionado.type;
      } else {
        if (!textoSenha) return alert("Digite a senha/nota!");
        const encoder = new TextEncoder();
        bytesParaCifrar = encoder.encode(textoSenha);
        tipoMime = 'secret/text'; 
      }

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const conteudoCifrado = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, chaveMestra, bytesParaCifrar
      );

      const payload = {
        dono: usuario,
        nomeOriginal: tituloItem,
        tipoArquivo: tipoMime,
        iv: bufferParaBase64(iv),
        conteudo: bufferParaBase64(conteudoCifrado)
      };

      const resp = await fetch(`${API_URL}/api/salvar`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        setModalAberto(false);
        limparFormulario();
        carregarLista();
        alert("Item salvo com segurança!");
      } else {
        alert("Erro ao salvar.");
      }
      setStatus("");

    } catch (error) {
      console.error(error);
      setStatus("Erro técnico.");
    }
  }

  async function abrirItem(id) {
    setItemAberto(null);
    setStatus("Baixando e Descriptografando...");

    try {
      const resp = await fetch(`${API_URL}/api/arquivo/${id}`);
      const dados = await resp.json();

      const iv = base64ParaBuffer(dados.iv);
      const conteudo = base64ParaBuffer(dados.conteudo);

      const bytesDecifrados = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv }, chaveMestra, conteudo
      );

      if (dados.tipoArquivo === 'secret/text') {
        const decoder = new TextDecoder();
        const textoRevelado = decoder.decode(bytesDecifrados);
        setItemAberto({ tipo: 'texto', conteudo: textoRevelado, nome: dados.nomeOriginal });
      } else {
        const blob = new Blob([bytesDecifrados], { type: dados.tipoArquivo });
        const url = URL.createObjectURL(blob);
        setItemAberto({ tipo: 'arquivo', url: url, nome: dados.nomeOriginal, mime: dados.tipoArquivo });
      }
      setStatus("");

    } catch (error) {
      alert("Erro ao descriptografar.");
      setStatus("");
    }
  }

  function limparFormulario() {
    setTituloItem("");
    setTextoSenha("");
    setArquivoSelecionado(null);
  }

  function sair() {
    navigate('/login', { replace: true });
  }

  return (
    <div className="dashboard-layout">
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo-area">
          <span style={{color: '#3b82f6'}}>🛡️</span> SecureVault
        </div>
        <button className={`nav-btn ${filtro === 'todos' ? 'active' : ''}`} onClick={() => setFiltro('todos')}>📂 Todos os Itens</button>
        <button className={`nav-btn ${filtro === 'texto' ? 'active' : ''}`} onClick={() => setFiltro('texto')}>🔑 Senhas</button>
        <button className={`nav-btn ${filtro === 'arquivo' ? 'active' : ''}`} onClick={() => setFiltro('arquivo')}>🖼️ Documentos</button>
        <div style={{marginTop: 'auto'}}>
          <div style={{padding: '10px', fontSize: '0.9rem', color: '#64748b'}}>Usuário: <strong style={{color: 'white'}}>{usuario}</strong></div>
          <button className="nav-btn logout-btn" onClick={sair}>Sair</button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="main-content">
        <div className="header-content">
          <h2>Meu Cofre {filtro !== 'todos' ? `(${filtro === 'texto' ? 'Senhas' : 'Arquivos'})` : ''}</h2>
          <button className="btn-primary" style={{width: 'auto'}} onClick={() => setModalAberto(true)}>+ Adicionar Novo</button>
        </div>

        <div className="items-grid">
          {itensFiltrados.length === 0 && <p style={{color: '#64748b'}}>Nenhum item encontrado.</p>}
          {itensFiltrados.map(item => (
            <div key={item._id} className="item-card" onClick={() => abrirItem(item._id)}>
              <div className="card-icon">{item.tipoArquivo === 'secret/text' ? '🔑' : '📄'}</div>
              <div className="card-title">{item.nomeOriginal}</div>
              <div className="card-meta">{new Date(item.dataUpload).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL ADICIONAR */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
              <h3>Guardar no Cofre</h3>
              <button className="btn-close" onClick={() => setModalAberto(false)}>✕</button>
            </div>
            <div className="tabs">
              <button className={`tab ${abaAtiva === 'arquivo' ? 'active' : ''}`} onClick={() => setAbaAtiva('arquivo')}>Arquivo</button>
              <button className={`tab ${abaAtiva === 'senha' ? 'active' : ''}`} onClick={() => setAbaAtiva('senha')}>Senha / Nota</button>
            </div>
            <label>Título</label>
            <input type="text" placeholder="Nome do item..." value={tituloItem} onChange={e => setTituloItem(e.target.value)} />
            {abaAtiva === 'arquivo' ? (
              <>
                <label>Selecione o Arquivo:</label>
                <input type="file" onChange={e => setArquivoSelecionado(e.target.files[0])} />
              </>
            ) : (
              <>
                <label>Conteúdo Secreto:</label>
                <textarea rows="4" placeholder="Senha..." value={textoSenha} onChange={e => setTextoSenha(e.target.value)}></textarea>
              </>
            )}
            <button className="btn-primary" onClick={handleSalvar}>{status || "Criptografar e Salvar"}</button>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR (MODIFICADO: SEM BOTÃO COPIAR E COM BLUR) */}
      {itemAberto && (
        <div className="modal-overlay" onClick={() => setItemAberto(null)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
              <h3 style={{margin: 0, color: '#10b981'}}>🔓 {itemAberto.nome}</h3>
              <button className="btn-close" onClick={() => setItemAberto(null)}>✕</button>
            </div>
            {itemAberto.tipo === 'texto' ? (
              <div style={{background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px dashed #334155'}}>
                <p style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px'}}>Passe o mouse para revelar:</p>
                {/* AQUI ESTÁ A CLASSE NOVA 'secret-blur' */}
                <p className="secret-blur" style={{fontFamily: 'monospace', fontSize: '1.5rem', wordBreak: 'break-all', color: '#fff', margin: 0}}>
                  {itemAberto.conteudo}
                </p>
                {/* Botão Copiar REMOVIDO daqui */}
              </div>
            ) : (
              <div style={{textAlign: 'center'}}>
                {itemAberto.mime.includes('image') ? (
                  <img src={itemAberto.url} style={{maxWidth: '100%', maxHeight: '60vh'}} alt="Secreto" />
                ) : (
                  <iframe src={itemAberto.url} style={{width: '100%', height: '60vh', border: 'none'}} title="Preview"></iframe>
                )}
                <br/><br/>
                <a href={itemAberto.url} download={itemAberto.nome} style={{color: '#3b82f6'}}>⬇️ Baixar Arquivo Original</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
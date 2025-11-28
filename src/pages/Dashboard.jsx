// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bufferParaBase64, base64ParaBuffer } from '../crypto';
import '../App.css';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { chaveMestra, usuario } = location.state || {};

  // Estados
  const [listaItens, setListaItens] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('arquivo'); // 'arquivo' ou 'senha'
  
  // Inputs do Formulário
  const [tituloItem, setTituloItem] = useState("");
  const [textoSenha, setTextoSenha] = useState("");
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);

  // Estados de Visualização
  const [itemAberto, setItemAberto] = useState(null); // Conteúdo do item aberto
  const [status, setStatus] = useState("");

  // SEU LINK DO RENDER (MANTIDO)
  const API_URL = "https://tcc-backend-4ept.onrender.com";

  // 1. SEGURANÇA
  useEffect(() => {
    if (!chaveMestra || !usuario) {
      navigate('/login', { replace: true });
    } else {
      carregarLista();
    }
  }, [chaveMestra, usuario, navigate]);

  // 2. BUSCAR LISTA
  async function carregarLista() {
    try {
      const resp = await fetch(`${API_URL}/api/meus-arquivos/${usuario}`);
      const dados = await resp.json();
      setListaItens(dados);
    } catch (error) {
      console.error("Erro ao carregar", error);
    }
  }

  // 3. SALVAR (ARQUIVO OU SENHA)
  async function handleSalvar() {
    if (!tituloItem) return alert("Dê um título para este item!");
    
    setStatus("Criptografando...");
    
    try {
      let bytesParaCifrar;
      let tipoMime;

      // A. PREPARAR OS DADOS (ARQUIVO vs TEXTO)
      if (abaAtiva === 'arquivo') {
        if (!arquivoSelecionado) return alert("Selecione um arquivo!");
        // Ler arquivo como bytes
        const reader = new FileReader();
        bytesParaCifrar = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsArrayBuffer(arquivoSelecionado);
        });
        tipoMime = arquivoSelecionado.type;
      } else {
        if (!textoSenha) return alert("Digite a senha/nota!");
        // Ler texto como bytes
        const encoder = new TextEncoder();
        bytesParaCifrar = encoder.encode(textoSenha);
        tipoMime = 'secret/text'; // Tipo especial que inventamos pra saber que é texto
      }

      // B. CRIPTOGRAFAR
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const conteudoCifrado = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, 
        chaveMestra, 
        bytesParaCifrar
      );

      // C. ENVIAR
      const payload = {
        dono: usuario,
        nomeOriginal: tituloItem, // Agora usamos o título que o usuário digitou
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

  // 4. ABRIR ITEM
  async function abrirItem(id) {
    setItemAberto(null);
    setStatus("Baixando e Descriptografando...");

    try {
      const resp = await fetch(`${API_URL}/api/arquivo/${id}`);
      const dados = await resp.json();

      const iv = base64ParaBuffer(dados.iv);
      const conteudo = base64ParaBuffer(dados.conteudo);

      const bytesDecifrados = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv }, 
        chaveMestra, 
        conteudo
      );

      // VERIFICA SE É TEXTO OU ARQUIVO
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
      alert("Erro ao descriptografar. Chave inválida ou dados corrompidos.");
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
      
      {/* 1. BARRA LATERAL (SIDEBAR) */}
      <div className="sidebar">
        <div className="logo-area">
          <span style={{color: '#3b82f6'}}>🛡️</span> SecureVault
        </div>
        
        <button className="nav-btn active">📂 Todos os Itens</button>
        <button className="nav-btn">🔑 Senhas</button>
        <button className="nav-btn">🖼️ Documentos</button>
        
        <div style={{marginTop: 'auto'}}>
          <div style={{padding: '10px', fontSize: '0.9rem', color: '#64748b'}}>
            Usuário: <strong style={{color: 'white'}}>{usuario}</strong>
          </div>
          <button className="nav-btn logout-btn" onClick={sair}>Sair</button>
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL */}
      <div className="main-content">
        <div className="header-content">
          <h2>Meu Cofre</h2>
          <button className="btn-primary" style={{width: 'auto'}} onClick={() => setModalAberto(true)}>
            + Adicionar Novo
          </button>
        </div>

        {/* GRID DE CARDS */}
        <div className="items-grid">
          {listaItens.map(item => (
            <div key={item._id} className="item-card" onClick={() => abrirItem(item._id)}>
              <div className="card-icon">
                {item.tipoArquivo === 'secret/text' ? '🔑' : '📄'}
              </div>
              <div className="card-title">{item.nomeOriginal}</div>
              <div className="card-meta">
                {new Date(item.dataUpload).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MODAL DE ADICIONAR (Pop-up) */}
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

            <label>Título (Ex: Foto RG ou Senha Instagram)</label>
            <input 
              type="text" 
              placeholder="Nome do item..." 
              value={tituloItem} 
              onChange={e => setTituloItem(e.target.value)} 
            />

            {abaAtiva === 'arquivo' ? (
              <>
                <label>Selecione o Arquivo:</label>
                <input type="file" onChange={e => setArquivoSelecionado(e.target.files[0])} />
              </>
            ) : (
              <>
                <label>Conteúdo Secreto:</label>
                <textarea 
                  rows="4" 
                  placeholder="Digite a senha ou nota aqui..." 
                  value={textoSenha}
                  onChange={e => setTextoSenha(e.target.value)}
                ></textarea>
              </>
            )}

            <button className="btn-primary" onClick={handleSalvar}>
              {status || "Criptografar e Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* 4. MODAL DE VISUALIZAÇÃO (Pop-up de arquivo aberto) */}
      {itemAberto && (
        <div className="modal-overlay" onClick={() => setItemAberto(null)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
              <h3 style={{margin: 0, color: '#10b981'}}>🔓 {itemAberto.nome}</h3>
              <button className="btn-close" onClick={() => setItemAberto(null)}>✕</button>
            </div>

            {itemAberto.tipo === 'texto' ? (
              <div style={{background: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px dashed #334155'}}>
                <p style={{fontFamily: 'monospace', fontSize: '1.2rem', wordBreak: 'break-all'}}>
                  {itemAberto.conteudo}
                </p>
                <button 
                  className="btn-primary" 
                  style={{marginTop: '10px'}}
                  onClick={() => navigator.clipboard.writeText(itemAberto.conteudo).then(() => alert("Copiado!"))}
                >
                  Copiar
                </button>
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
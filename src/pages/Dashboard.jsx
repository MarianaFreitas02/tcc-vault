import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bufferParaBase64, base64ParaBuffer } from '../crypto';
import '../App.css';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { chaveMestra, usuario } = location.state || {};
  const [listaArquivos, setListaArquivos] = useState([]);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [arquivoAbertoURL, setArquivoAbertoURL] = useState(null);

  // URL DO SEU BACKEND NO RENDER
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
      setListaArquivos(dados);
    } catch (error) {
      console.error("Erro ao carregar lista", error);
    }
  }

  async function handleUpload() {
    if (!arquivoSelecionado) return alert("Escolha um arquivo!");
    setStatus("🔒 Criptografando na memória...");
    setStatusType("loading");

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(arquivoSelecionado);
      reader.onload = async () => {
        const bytes = reader.result;
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const conteudoCifrado = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv }, chaveMestra, bytes
        );

        const payload = {
          dono: usuario,
          nomeOriginal: arquivoSelecionado.name,
          tipoArquivo: arquivoSelecionado.type,
          iv: bufferParaBase64(iv),
          conteudo: bufferParaBase64(conteudoCifrado)
        };

        const resposta = await fetch(`${API_URL}/api/salvar`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });

        if (resposta.ok) {
          setStatus("✅ Arquivo protegido e salvo com sucesso!");
          setStatusType("success");
          setArquivoSelecionado(null);
          carregarLista(); 
        } else {
          setStatus("Erro ao salvar no servidor.");
          setStatusType("error");
        }
      };
    } catch (error) {
      setStatus("Erro técnico: " + error.message);
      setStatusType("error");
    }
  }

  async function abrirArquivo(id) {
    setStatus("☁️ Baixando arquivo cifrado...");
    setStatusType("loading");
    setArquivoAbertoURL(null);

    try {
      const resp = await fetch(`${API_URL}/api/arquivo/${id}`);
      if (!resp.ok) throw new Error("Arquivo não encontrado");
      const dados = await resp.json();

      setStatus("🔓 Descriptografando...");
      const iv = base64ParaBuffer(dados.iv);
      const conteudo = base64ParaBuffer(dados.conteudo);

      const bytesDecifrados = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv }, chaveMestra, conteudo
      );

      const blob = new Blob([bytesDecifrados], { type: dados.tipoArquivo });
      const url = URL.createObjectURL(blob);
      setArquivoAbertoURL(url);
      setStatus(`Arquivo "${dados.nomeOriginal}" aberto!`);
      setStatusType("success");
    } catch (error) {
      console.error(error);
      setStatus("⛔ Erro: Integridade violada ou chave inválida.");
      setStatusType("error");
    }
  }

  function sair() {
    setListaArquivos([]);
    setArquivoAbertoURL(null);
    navigate('/login', { replace: true });
  }

  return (
    <div className="container" style={{maxWidth: '800px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px'}}>
        <div>
          <h2 style={{margin: 0, color: '#f1f5f9'}}>Cofre de <span style={{color: '#3b82f6'}}>{usuario}</span></h2>
          <small style={{color: '#94a3b8'}}>Ambiente Seguro (RAM)</small>
        </div>
        <button onClick={sair} style={{background: '#ef4444', padding: '10px 20px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>Sair com Segurança</button>
      </div>

      <div style={{background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #334155'}}>
        <h4 style={{marginTop: 0, color: '#cbd5e1'}}>Adicionar Novo Item ao Cofre</h4>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap'}}>
          <input type="file" onChange={e => setArquivoSelecionado(e.target.files[0])} style={{flex: 1}} />
          <button className="btn-encrypt" onClick={handleUpload} style={{whiteSpace: 'nowrap'}}>🔒 Proteger & Enviar</button>
        </div>
        {status && <div className={`status-box ${statusType}`} style={{marginTop: '15px'}}>{status}</div>}
      </div>

      <div className="form-group">
        <h4 style={{color: '#cbd5e1'}}>Meus Arquivos Protegidos</h4>
        {listaArquivos.length === 0 ? (
          <p style={{color: '#64748b', fontStyle: 'italic'}}>Seu cofre está vazio.</p>
        ) : (
          <div style={{display: 'grid', gap: '12px'}}>
            {listaArquivos.map(arq => (
              <div key={arq._id} style={{background: '#0f172a', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '1.2rem'}}>📄</span>
                  <div>
                    <div style={{fontWeight: 'bold', color: '#e2e8f0'}}>{arq.nomeOriginal}</div>
                    <div style={{fontSize: '0.8rem', color: '#64748b'}}>{new Date(arq.dataUpload).toLocaleDateString()}</div>
                  </div>
                </div>
                <button className="btn-decrypt" style={{padding: '8px 20px', fontSize: '0.9rem'}} onClick={() => abrirArquivo(arq._id)}>🔓 Abrir</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {arquivoAbertoURL && (
        <div className="preview-area" style={{marginTop: '30px', scrollMarginTop: '20px'}}>
          <p style={{color: '#10b981', fontWeight: 'bold'}}>Arquivo Descriptografado (Somente na RAM):</p>
          <iframe src={arquivoAbertoURL} style={{width: '100%', height: '500px', border: '1px solid #334155', borderRadius: '8px', background: 'white'}} title="Preview"></iframe>
          <div style={{textAlign: 'center', marginTop: '15px'}}>
            <a href={arquivoAbertoURL} download="arquivo_secreto_recuperado" className="download-link">⬇️ Baixar Arquivo Original</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
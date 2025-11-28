// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bufferParaBase64, base64ParaBuffer } from '../crypto';
import '../App.css';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Recupera a chave e o usuário que vieram da memória da tela de Login
  // Se o usuário tentar entrar direto pela URL, isso aqui será undefined/null
  const { chaveMestra, usuario } = location.state || {};

  const [listaArquivos, setListaArquivos] = useState([]);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // 'success', 'error', 'loading'
  const [arquivoAbertoURL, setArquivoAbertoURL] = useState(null);

  // --- 1. SEGURANÇA (MODIFICADO) ---
  useEffect(() => {
    // Verifica se a chave existe na memória RAM
    if (!chaveMestra || !usuario) {
      // replace: true -> Substitui a entrada atual no histórico.
      // Impede que o botão "Voltar" funcione para acessar esta página.
      navigate('/login', { replace: true });
    } else {
      carregarLista();
    }
  }, [chaveMestra, usuario, navigate]);

  // --- 2. BUSCAR LISTA ---
  async function carregarLista() {
    try {
      const resp = await fetch(`http://localhost:3000/api/meus-arquivos/${usuario}`);
      const dados = await resp.json();
      setListaArquivos(dados);
    } catch (error) {
      console.error("Erro ao carregar lista", error);
    }
  }

  // --- 3. UPLOAD SEGURO ---
  async function handleUpload() {
    if (!arquivoSelecionado) return alert("Escolha um arquivo!");
    
    setStatus("🔒 Criptografando na memória...");
    setStatusType("loading");

    try {
      // A. Ler arquivo para a RAM
      const reader = new FileReader();
      reader.readAsArrayBuffer(arquivoSelecionado);
      
      reader.onload = async () => {
        const bytes = reader.result;
        
        // B. Criptografar (Client-Side Encryption)
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const conteudoCifrado = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv }, 
          chaveMestra, 
          bytes
        );

        // C. Enviar para a Nuvem
        const payload = {
          dono: usuario,
          nomeOriginal: arquivoSelecionado.name,
          tipoArquivo: arquivoSelecionado.type, // Ex: image/png, application/pdf
          iv: bufferParaBase64(iv),
          conteudo: bufferParaBase64(conteudoCifrado)
        };

        const resp = await fetch('http://localhost:3000/api/salvar', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          setStatus("✅ Arquivo protegido e salvo com sucesso!");
          setStatusType("success");
          setArquivoSelecionado(null);
          // Recarrega a lista para mostrar o novo arquivo
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

  // --- 4. DOWNLOAD E DESCRIPTOGRAFIA ---
  async function abrirArquivo(id) {
    setStatus("☁️ Baixando arquivo cifrado...");
    setStatusType("loading");
    setArquivoAbertoURL(null);

    try {
      // A. Baixar o "lixo" do servidor
      const resp = await fetch(`http://localhost:3000/api/arquivo/${id}`);
      if (!resp.ok) throw new Error("Arquivo não encontrado");
      
      const dados = await resp.json();

      setStatus("🔓 Descriptografando...");

      // B. Converter Base64 para Bytes
      const iv = base64ParaBuffer(dados.iv);
      const conteudo = base64ParaBuffer(dados.conteudo);

      // C. A Mágica: Destrancar usando a chave da memória
      const bytesDecifrados = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv }, 
        chaveMestra, 
        conteudo
      );

      // D. Criar visualização
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

  // --- 5. LOGOUT SEGURO (MODIFICADO) ---
  function sair() {
    // Limpa estados visuais
    setListaArquivos([]);
    setArquivoAbertoURL(null);
    
    // Força a navegação destruindo o histórico anterior
    navigate('/login', { replace: true });
  }

  return (
    <div className="container" style={{maxWidth: '800px'}}>
      
      {/* HEADER DO DASHBOARD */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px'}}>
        <div>
          <h2 style={{margin: 0, color: '#f1f5f9'}}>Cofre de <span style={{color: '#3b82f6'}}>{usuario}</span></h2>
          <small style={{color: '#94a3b8'}}>Ambiente Seguro (RAM)</small>
        </div>
        <button onClick={sair} style={{background: '#ef4444', padding: '10px 20px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
          Sair com Segurança
        </button>
      </div>

      {/* ÁREA DE UPLOAD */}
      <div style={{background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #334155'}}>
        <h4 style={{marginTop: 0, color: '#cbd5e1'}}>Adicionar Novo Item ao Cofre</h4>
        
        <div style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap'}}>
          <input 
            type="file" 
            onChange={e => setArquivoSelecionado(e.target.files[0])} 
            style={{flex: 1}}
          />
          <button className="btn-encrypt" onClick={handleUpload} style={{whiteSpace: 'nowrap'}}>
            🔒 Proteger & Enviar
          </button>
        </div>
        
        {status && (
          <div className={`status-box ${statusType}`} style={{marginTop: '15px'}}>
            {status}
          </div>
        )}
      </div>

      {/* LISTA DE ARQUIVOS */}
      <div className="form-group">
        <h4 style={{color: '#cbd5e1'}}>Meus Arquivos Protegidos</h4>
        
        {listaArquivos.length === 0 ? (
          <p style={{color: '#64748b', fontStyle: 'italic'}}>Seu cofre está vazio.</p>
        ) : (
          <div style={{display: 'grid', gap: '12px'}}>
            {listaArquivos.map(arq => (
              <div key={arq._id} style={{
                background: '#0f172a', 
                padding: '15px', 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #334155',
                transition: 'border-color 0.2s'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '1.2rem'}}>📄</span>
                  <div>
                    <div style={{fontWeight: 'bold', color: '#e2e8f0'}}>{arq.nomeOriginal}</div>
                    <div style={{fontSize: '0.8rem', color: '#64748b'}}>
                      {new Date(arq.dataUpload).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <button 
                  className="btn-decrypt" 
                  style={{padding: '8px 20px', fontSize: '0.9rem'}} 
                  onClick={() => abrirArquivo(arq._id)}
                >
                  🔓 Abrir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ÁREA DE PREVIEW (ARQUIVO ABERTO) */}
      {arquivoAbertoURL && (
        <div className="preview-area" style={{marginTop: '30px', scrollMarginTop: '20px'}}>
          <p style={{color: '#10b981', fontWeight: 'bold'}}>Arquivo Descriptografado (Somente na RAM):</p>
          
          <iframe 
            src={arquivoAbertoURL} 
            style={{width: '100%', height: '500px', border: '1px solid #334155', borderRadius: '8px', background: 'white'}} 
            title="Preview"
          ></iframe>
          
          <div style={{textAlign: 'center', marginTop: '15px'}}>
            <a href={arquivoAbertoURL} download="arquivo_secreto_recuperado" className="download-link">
              ⬇️ Baixar Arquivo Original
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
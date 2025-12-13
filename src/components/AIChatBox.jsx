// src/components/AIChatBox.jsx
import { useState, useRef, useEffect } from 'react';
import '../App.css'; 

export default function AIChatBox() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { remetente: 'ia', texto: 'NEXUS ONLINE. Aguardando comando...' }
  ]);
  const [input, setInput] = useState("");
  const [ouvindo, setOuvindo] = useState(false);
  const fimDoChatRef = useRef(null);

  // Rolar para baixo automático
  useEffect(() => {
    fimDoChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviarMensagem = () => {
    if (!input.trim()) return;

    // 1. Mensagem do Usuário
    const novaMsgUsuario = { remetente: 'usuario', texto: input };
    setMensagens(prev => [...prev, novaMsgUsuario]);
    setInput("");

    // 2. Resposta Simulada da IA (Nexus)
    setTimeout(() => {
      const respostaIA = { 
        remetente: 'ia', 
        texto: `Processando comando: "${novaMsgUsuario.texto}"... [Recurso Backend Indisponível]` 
      };
      setMensagens(prev => [...prev, respostaIA]);
    }, 1000);
  };

  const alternarVoz = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Navegador sem suporte a voz.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    
    if (!ouvindo) {
      recognition.start();
      setOuvindo(true);
      recognition.onresult = (event) => {
        setInput(event.results[0][0].transcript);
        setOuvindo(false);
      };
      recognition.onend = () => setOuvindo(false);
    } else {
      recognition.stop();
      setOuvindo(false);
    }
  };

  return (
    <div className={`ai-widget ${aberto ? 'open' : ''}`}>
      {/* Botão Flutuante */}
      <button 
        onClick={() => setAberto(!aberto)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'black', border: '2px solid #00ff41',
          color: '#00ff41', fontSize: '24px', cursor: 'pointer',
          zIndex: 1000, boxShadow: '0 0 15px rgba(0,255,65,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {aberto ? '✕' : '🤖'}
      </button>

      {/* Janela do Chat */}
      {aberto && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '20px',
          width: '300px', height: '400px', background: 'rgba(0,0,0,0.9)',
          border: '1px solid #00ff41', borderRadius: '10px',
          display: 'flex', flexDirection: 'column', zIndex: 1000,
          boxShadow: '0 0 20px rgba(0,255,65,0.2)'
        }}>
          {/* Header */}
          <div style={{padding: '10px', borderBottom: '1px solid #00ff41', color: '#00ff41', fontFamily: 'monospace', fontWeight: 'bold'}}>
            NEXUS AI v2.0
          </div>

          {/* Área de Mensagens */}
          <div style={{flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {mensagens.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.remetente === 'usuario' ? 'flex-end' : 'flex-start',
                background: msg.remetente === 'usuario' ? '#00ff41' : '#333',
                color: msg.remetente === 'usuario' ? 'black' : '#00ff41',
                padding: '8px', borderRadius: '5px', maxWidth: '80%',
                fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 'bold'
              }}>
                {msg.texto}
              </div>
            ))}
            <div ref={fimDoChatRef} />
          </div>

          {/* Input Area */}
          <div style={{padding: '10px', borderTop: '1px solid #00ff41', display: 'flex', gap: '5px'}}>
            <button onClick={alternarVoz} style={{background: 'none', border: '1px solid #00ff41', color: '#00ff41', cursor: 'pointer', borderRadius: '4px'}}>
              {ouvindo ? '👂' : '🎤'}
            </button>
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && enviarMensagem()}
              placeholder="Comando..."
              style={{flex: 1, background: 'black', border: '1px solid #333', color: 'white', padding: '5px', fontFamily: 'monospace'}}
            />
            <button onClick={enviarMensagem} style={{background: '#00ff41', border: 'none', color: 'black', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px'}}>
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
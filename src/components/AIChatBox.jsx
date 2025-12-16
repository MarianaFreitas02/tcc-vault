import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Terminal, Cpu } from 'lucide-react';
import '../App.css';

export default function AIChatBox() {
  const [aberto, setAberto] = useState(false);
  const [input, setInput] = useState("");
  const [mensagens, setMensagens] = useState([
    { autor: 'bot', texto: 'NEXUS SYSTEM v2.0 ONLINE. Como posso auxiliar, Agente?' }
  ]);
  
  const messagesEndRef = useRef(null);

  const rolarParaBaixo = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(rolarParaBaixo, [mensagens]);

  // --- CÉREBRO DO BOT (OFFLINE) ---
  const processarResposta = (pergunta) => {
    const p = pergunta.toLowerCase();
    let resposta = "";

    if (p.includes('ola') || p.includes('oi')) {
      resposta = "Saudações. O sistema está operando com criptografia AES-256.";
    } 
    else if (p.includes('ajuda') || p.includes('help')) {
      resposta = "COMANDOS DISPONÍVEIS: \n- 'status': Ver integridade.\n- 'senha': Dicas de segurança.\n- 'limpar': Limpar chat.";
    }
    else if (p.includes('status') || p.includes('sistema')) {
      resposta = "STATUS: Todos os serviços operacionais. Banco de dados conectado. Nenhuma intrusão detectada no momento.";
    }
    else if (p.includes('senha') || p.includes('gerar')) {
      resposta = "Use a aba 'GERADOR' para criar chaves de alta entropia. Nunca compartilhe sua chave mestra.";
    }
    else if (p.includes('quem é você') || p.includes('quem e voce')) {
      resposta = "Sou o Assistente Tático NEXUS, uma interface lógica para gerenciamento do cofre.";
    }
    else {
      resposta = `Comando '${p}' não reconhecido. Digite 'ajuda' para ver as opções.`;
    }

    return resposta;
  };

  const enviarMensagem = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Adiciona mensagem do usuário
    const novaMsgUser = { autor: 'user', texto: input };
    setMensagens(prev => [...prev, novaMsgUser]);
    
    // Processa resposta do bot (simula delay de digitação)
    setTimeout(() => {
        if (input.toLowerCase() === 'limpar') {
            setMensagens([{ autor: 'bot', texto: 'Terminal limpo.' }]);
        } else {
            const respostaBot = processarResposta(input);
            setMensagens(prev => [...prev, novaMsgUser, { autor: 'bot', texto: respostaBot }]);
        }
    }, 600);

    setInput("");
  };

  if (!aberto) {
    return (
      <button 
        onClick={() => setAberto(true)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          background: '#000', border: '1px solid #00ff41', color: '#00ff41',
          width: '50px', height: '50px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 1000, boxShadow: '0 0 10px #00ff41'
        }}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '20px',
      width: '320px', height: '450px', background: 'rgba(0,0,0,0.95)',
      border: '1px solid #00ff41', display: 'flex', flexDirection: 'column',
      zIndex: 1000, boxShadow: '0 0 20px rgba(0,255,65,0.2)'
    }}>
      {/* CABEÇALHO */}
      <div style={{
        padding: '10px', borderBottom: '1px solid #00ff41', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#051a05'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff41', fontWeight: 'bold'}}>
          <Terminal size={16} /> NEXUS_AI_V1
        </div>
        <button onClick={() => setAberto(false)} style={{background: 'none', border: 'none', color: '#00ff41', cursor: 'pointer'}}>
          <X size={18} />
        </button>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div style={{flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
        {mensagens.map((msg, index) => (
          <div key={index} style={{
            alignSelf: msg.autor === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.autor === 'user' ? '#003300' : '#111',
            color: msg.autor === 'user' ? '#fff' : '#00ff41',
            padding: '8px 12px',
            border: `1px solid ${msg.autor === 'user' ? '#005500' : '#333'}`,
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-line' // Permite quebra de linha com \n
          }}>
            {msg.autor === 'bot' && <Cpu size={12} style={{marginRight: '5px', display: 'inline'}} />}
            {msg.texto}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={enviarMensagem} style={{
        padding: '10px', borderTop: '1px solid #333', display: 'flex', gap: '10px'
      }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite um comando..."
          style={{
            flex: 1, background: '#000', border: 'none', color: '#fff', 
            outline: 'none', fontFamily: 'monospace'
          }}
        />
        <button type="submit" style={{background: 'none', border: 'none', color: '#00ff41', cursor: 'pointer'}}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
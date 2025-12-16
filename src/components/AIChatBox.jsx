import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Terminal, Cpu } from 'lucide-react';
import '../App.css';

export default function AIChatBox() {
  const [aberto, setAberto] = useState(false);
  const [input, setInput] = useState("");
  const [mensagens, setMensagens] = useState([
    { autor: 'bot', texto: 'NEXUS SYSTEM v2.0 ONLINE. Digite o nome de um diretório para saber sua função.' }
  ]);
  
  const messagesEndRef = useRef(null);

  const rolarParaBaixo = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(rolarParaBaixo, [mensagens]);

  // --- CÉREBRO DO BOT (LÓGICA ATUALIZADA) ---
  const processarResposta = (pergunta) => {
    const p = pergunta.toLowerCase();
    
    // --- EXPLICAÇÕES DOS DIRETÓRIOS ---
    if (p.includes('raiz')) {
      return "📁 [ RAIZ ]: É o diretório mestre. Ele exibe TUDO o que está guardado no cofre (Textos, Mídia, Arquivos e Senhas) em uma única lista sem filtros.";
    }
    else if (p.includes('texto')) {
      return "📄 [ TEXTOS ]: Área dedicada para notas seguras. Ideal para salvar códigos, chaves privadas, diários ou anotações rápidas. O conteúdo é criptografado como texto puro.";
    }
    else if (p.includes('arquivo')) {
      return "📂 [ ARQUIVOS ]: Armazena documentos genéricos (PDF, DOCX, ZIP, EXE). Qualquer arquivo binário que não seja mídia ou texto deve ser salvo/buscado aqui.";
    }
    else if (p.includes('midia') || p.includes('mídia')) {
      return "🎬 [ MÍDIA ]: Otimizado para arquivos audiovisuais. O sistema detecta automaticamente Imagens, Vídeos e Áudios e permite a visualização direta (Play/View) dentro do cofre.";
    }
    else if (p.includes('senha') && !p.includes('gerar')) {
      // Diferencia "Senhas" (pasta) de "Gerar Senha" (ação)
      return "🔑 [ SENHAS ]: Seu gerenciador de credenciais. Armazena URL, Usuário e Senha de forma estruturada. Possui botões para copiar rapidamente e link seguro para abrir o site.";
    }
    else if (p.includes('sistema') || p.includes('integridade')) {
      return "🖥️ [ SISTEMA ]: Painel de Telemetria. Monitora a conexão com o banco, detecta ataques de força bruta (Brute Force) e contém o botão de AUTO-DESTRUIÇÃO.";
    }
    else if (p.includes('gerador') || (p.includes('gerar') && p.includes('senha'))) {
      return "🔀 [ GERADOR ]: Utilitário de entropia. Cria senhas matematicamente fortes (até 64 caracteres) que podem ser salvas diretamente no diretório de Senhas.";
    }

    // --- COMANDOS GERAIS ---
    else if (p.includes('ola') || p.includes('oi')) {
      return "Saudações, Agente. Digite o nome de uma pasta (ex: 'Midia') que eu explico o funcionamento.";
    } 
    else if (p.includes('ajuda') || p.includes('help')) {
      return "COMANDOS: Digite 'raiz', 'textos', 'midia', 'arquivos' ou 'senhas' para detalhes sobre cada seção.";
    }
    else if (p.includes('quem é você') || p.includes('quem e voce')) {
      return "Sou o Assistente Tático NEXUS, responsável pela orientação operacional deste dispositivo.";
    }
    else {
      return `Comando '${p}' não reconhecido. Tente digitar o nome de um diretório.`;
    }
  };

  const enviarMensagem = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const novaMsgUser = { autor: 'user', texto: input };
    setMensagens(prev => [...prev, novaMsgUser]);
    
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
      <div style={{
        padding: '10px', borderBottom: '1px solid #00ff41', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#051a05'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff41', fontWeight: 'bold'}}>
          <Terminal size={16} /> NEXUS_AI_V2
        </div>
        <button onClick={() => setAberto(false)} style={{background: 'none', border: 'none', color: '#00ff41', cursor: 'pointer'}}>
          <X size={18} />
        </button>
      </div>

      <div style={{flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
        {mensagens.map((msg, index) => (
          <div key={index} style={{
            alignSelf: msg.autor === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '90%',
            background: msg.autor === 'user' ? '#003300' : '#111',
            color: msg.autor === 'user' ? '#fff' : '#00ff41',
            padding: '8px 12px',
            border: `1px solid ${msg.autor === 'user' ? '#005500' : '#333'}`,
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-line'
          }}>
            {msg.autor === 'bot' && <Cpu size={12} style={{marginRight: '5px', display: 'inline'}} />}
            {msg.texto}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={enviarMensagem} style={{
        padding: '10px', borderTop: '1px solid #333', display: 'flex', gap: '10px'
      }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite o nome do diretório..."
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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [dados, setDados] = useState({ ultimosIncidentes: [], topAtacantes: [] });
  const [status, setStatus] = useState("INICIALIZANDO...");
  const navigate = useNavigate();

  const carregarDados = async () => {
    try {
      const res = await fetch('/api/admin/ameacas');
      if (!res.ok) throw new Error('Falha na requisição');
      
      const data = await res.json();
      setDados(data);
      
      // Lógica de Status
      if (data.ultimosIncidentes && data.ultimosIncidentes.length > 0) {
        const ultimo = new Date(data.ultimosIncidentes[0].data);
        const agora = new Date();
        const diff = (agora - ultimo) / 1000 / 60; // minutos
        
        if (diff < 5) setStatus("ALERTA: TRÁFEGO HOSTIL DETECTADO");
        else setStatus("SISTEMA ONLINE :: MONITORANDO");
      } else {
        setStatus("SISTEMA SEGURO :: NENHUMA AMEAÇA");
      }

    } catch (erro) {
      console.error(erro);
      setStatus("ERRO DE CONEXÃO COM O SERVIDOR");
    }
  };

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 3000); // Atualiza a cada 3s (mais rápido)
    return () => clearInterval(intervalo);
  }, []);

  // Determina a cor do status
  const getStatusColor = () => {
    if (status.includes("ALERTA")) return '#ff3333'; // Vermelho
    if (status.includes("ERRO")) return '#ffbb33';   // Amarelo
    return '#00ff41'; // Verde Hacker
  };

  return (
    <div style={styles.container}>
      {/* HEADER / BARRA SUPERIOR */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span style={{color: '#fff'}}>ROOT@NEXUS:</span>
            ~/ADMIN/SIEM_DASHBOARD
            <span style={styles.cursor}>_</span>
          </h1>
          <p style={styles.subtitle}>SISTEMA DE MITIGAÇÃO DE AMEAÇAS & LOGS DE SEGURANÇA</p>
        </div>
        
        <div style={{...styles.statusBox, borderColor: getStatusColor(), color: getStatusColor()}}>
          <span style={styles.blink}>●</span> {status}
        </div>
      </div>

      <div style={styles.grid}>
        
        {/* COLUNA 1: ALVOS BLOQUEADOS */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            {'['} LISTA_NEGRA_IPS {']'}
          </h3>
          <div style={styles.tableHeader}>
            <span>ENDEREÇO_IP</span>
            <span>TENTATIVAS_BLOCK</span>
          </div>
          <div style={styles.scrollArea}>
            {dados.topAtacantes.length === 0 ? (
              <div style={styles.empty}>[ NENHUM DADO REGISTRADO ]</div>
            ) : (
              dados.topAtacantes.map((item, index) => (
                <div key={index} style={styles.row}>
                  <span style={{color: '#fff'}}>{item._id}</span>
                  <span style={{color: '#ff3333', fontWeight: 'bold'}}>
                    {item.total} REQ/BLOQ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUNA 2: FEED DE LOGS */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            {'['} FEED_TEMPO_REAL {']'}
          </h3>
          <div style={styles.scrollArea}>
             {dados.ultimosIncidentes.length === 0 ? (
              <div style={styles.empty}>[ AGUARDANDO PACOTES... ]</div>
            ) : (
              dados.ultimosIncidentes.map((log, index) => (
                <div key={index} style={styles.logRow}>
                  <span style={{
                    color: log.acao === 'BLOQUEIO_ATIVO' ? '#ff3333' : '#ffbb33',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}>
                    {log.acao === 'BLOQUEIO_ATIVO' ? '[⛔ BLOCK]' : '[⚠️ WARN]'}
                  </span>
                  <span style={{color: '#ccc', marginRight: '10px'}}>
                    SRC: {log.ip}
                  </span>
                  <span style={{color: '#666', fontSize: '0.8rem', float: 'right'}}>
                    {new Date(log.data).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RODAPÉ TÉCNICO */}
      <div style={styles.footer}>
        <p>MEM_USAGE: 42MB | CPU_LOAD: 12% | UPTIME: 99.9% | ENCRYPTION: AES-256-GCM</p>
      </div>
    </div>
  );
}

// --- ESTILOS CYBERPUNK / TERMINAL ---
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000000', // Preto absoluto
    color: '#00ff41',           // Verde Fósforo
    fontFamily: "'Courier New', Courier, monospace", // Fonte Terminal
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    borderBottom: '2px solid #333',
    paddingBottom: '1rem',
    marginBottom: '2rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  subtitle: {
    margin: '5px 0 0 0',
    fontSize: '0.8rem',
    color: '#666',
  },
  cursor: {
    animation: 'blink 1s step-end infinite',
  },
  statusBox: {
    border: '1px solid',
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  blink: {
    animation: 'blink 1s infinite',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // 2 Colunas
    gap: '2rem',
    flex: 1,
  },
  card: {
    border: '1px solid #00ff41', // Borda Verde Hacker
    backgroundColor: '#050505',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 10px rgba(0, 255, 65, 0.1)', // Brilho leve
  },
  cardTitle: {
    marginTop: 0,
    borderBottom: '1px dashed #333',
    paddingBottom: '10px',
    marginBottom: '10px',
    color: '#fff',
    fontSize: '1.1rem',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 10px',
    backgroundColor: '#111',
    color: '#00ff41',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    marginBottom: '5px',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    fontFamily: "'Consolas', 'Monaco', monospace",
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderBottom: '1px solid #111',
    fontSize: '0.9rem',
  },
  logRow: {
    padding: '6px 0',
    borderBottom: '1px solid #111',
    fontSize: '0.85rem',
  },
  empty: {
    padding: '2rem',
    textAlign: 'center',
    color: '#444',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: '2rem',
    borderTop: '1px solid #333',
    paddingTop: '1rem',
    textAlign: 'center',
    fontSize: '0.7rem',
    color: '#444',
  }
};

// Adicione isso no seu index.css global se a animação não funcionar,
// mas o React geralmente lida bem se já tiver em outro lugar.
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);
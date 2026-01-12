import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [dados, setDados] = useState({ ultimosIncidentes: [], topAtacantes: [] });
  const [status, setStatus] = useState("BUSCANDO...");

  // Busca os dados da API que criamos
  const carregarDados = async () => {
    try {
      const res = await fetch('https://nexus-access.vercel.app/api/admin/ameacas');
      const data = await res.json();
      setDados(data);
      
      // Define o status do sistema baseado nos logs recentes
      if (data.ultimosIncidentes.length > 0) {
        // Se o último log foi há menos de 5 min, está sob ataque
        const ultimo = new Date(data.ultimosIncidentes[0].data);
        const agora = new Date();
        const diff = (agora - ultimo) / 1000 / 60; // diferença em minutos
        
        if (diff < 5) setStatus("SOB ATAQUE 🚨");
        else setStatus("MONITORANDO 🛡️");
      } else {
        setStatus("SEGURO ✅");
      }

    } catch (erro) {
      console.error(erro);
      setStatus("ERRO DE CONEXÃO");
    }
  };

  useEffect(() => {
    carregarDados();
    // Atualiza a cada 5 segundos (Live Dashboard)
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Painel de Inteligência de Ameaças (SIEM)</h1>
        <div style={{ 
          padding: '10px 20px', 
          borderRadius: '8px', 
          fontWeight: 'bold',
          backgroundColor: status.includes('ATAQUE') ? '#ff4444' : '#00C851' 
        }}>
          STATUS: {status}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* COLUNA 1: TOP ATACANTES */}
        <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '12px' }}>
          <h3>🔫 Top IPs Bloqueados</h3>
          <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem' }}>
            <thead>
              <tr style={{ color: '#888' }}>
                <th>Endereço IP</th>
                <th>Tentativas</th>
              </tr>
            </thead>
            <tbody>
              {dados.topAtacantes.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px 0', fontFamily: 'monospace' }}>{item._id}</td>
                  <td style={{ color: '#ff4444', fontWeight: 'bold' }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* COLUNA 2: LOGS EM TEMPO REAL */}
        <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '12px' }}>
          <h3>📜 Feed de Incidentes (Live)</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
            {dados.ultimosIncidentes.map((log, index) => (
              <div key={index} style={{ 
                padding: '10px', 
                borderBottom: '1px solid #333',
                fontSize: '0.9rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ 
                    color: log.acao === 'BLOQUEIO_ATIVO' ? '#ff4444' : '#ffbb33',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}>
                    [{log.acao}]
                  </span>
                  <span style={{ color: '#ccc' }}>IP: {log.ip}</span>
                </div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                  {new Date(log.data).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
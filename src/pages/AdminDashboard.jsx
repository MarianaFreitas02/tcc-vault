import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [dados, setDados] = useState({ ultimosIncidentes: [], topAtacantes: [] });
  const [status, setStatus] = useState("BUSCANDO...");

  const carregarDados = async () => {
    try {
      // Nota: Na Vercel, para chamar a própria API, use caminho relativo se estiver no mesmo domínio
      // ou a URL completa se preferir. Vamos tentar relativo para evitar erro de CORS/Domain.
      const res = await fetch('/api/admin/ameacas');
      
      if (!res.ok) throw new Error('Falha na requisição');
      
      const data = await res.json();
      setDados(data);
      
      if (data.ultimosIncidentes && data.ultimosIncidentes.length > 0) {
        const ultimo = new Date(data.ultimosIncidentes[0].data);
        const agora = new Date();
        const diff = (agora - ultimo) / 1000 / 60; 
        
        if (diff < 5) setStatus("SOB ATAQUE 🚨");
        else setStatus("MONITORANDO 🛡️");
      } else {
        setStatus("SEGURO ✅");
      }

    } catch (erro) {
      console.error(erro);
      setStatus("ERRO / OFF");
    }
  };

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{color: '#333'}}>SIEM - Painel de Ameaças</h1>
        <div style={{ 
          padding: '10px 20px', 
          borderRadius: '8px', 
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: status.includes('ATAQUE') ? '#ff4444' : (status.includes('SEGURO') ? '#00C851' : '#ffbb33') 
        }}>
          STATUS: {status}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* COLUNA 1 */}
        <div style={{ background: '#333', padding: '1.5rem', borderRadius: '12px', color: 'white' }}>
          <h3>🔫 Top IPs Bloqueados</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {dados.topAtacantes?.map((item, index) => (
              <li key={index} style={{ borderBottom: '1px solid #555', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                <span>{item._id}</span>
                <span style={{ color: '#ff4444', fontWeight: 'bold' }}>{item.total} tentativas</span>
              </li>
            ))}
          </ul>
        </div>

        {/* COLUNA 2 */}
        <div style={{ background: '#333', padding: '1.5rem', borderRadius: '12px', color: 'white' }}>
          <h3>📜 Feed ao Vivo</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {dados.ultimosIncidentes?.map((log, index) => (
              <div key={index} style={{ padding: '8px 0', borderBottom: '1px solid #555', fontSize: '0.9rem' }}>
                <strong style={{ color: log.acao === 'BLOQUEIO_ATIVO' ? '#ff4444' : '#ffbb33' }}>[{log.acao}]</strong> 
                {' '}- IP: {log.ip}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
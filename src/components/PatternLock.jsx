import { useState } from 'react';
import '../App.css';

export default function PatternLock({ onComplete }) {
  const [sequencia, setSequencia] = useState([]);

  const handleClick = (numero) => {
    // Evita repetir o mesmo ponto imediatamente
    if (sequencia.includes(numero)) return;
    
    const novaSequencia = [...sequencia, numero];
    setSequencia(novaSequencia);

    // Se a pessoa parar de clicar por 1.5s ou clicar em "Confirmar", enviamos
    // Aqui vamos deixar um botão de confirmar para ser mais seguro
  };

  const limpar = () => setSequencia([]);
  
  const confirmar = () => {
    if (sequencia.length < 4) return alert("Padrão muito curto!");
    onComplete(sequencia.join('-')); // Transforma [1, 2, 3] em "1-2-3"
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div className="pattern-grid" style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', 
        padding: '15px', background: 'rgba(0,0,0,0.5)', border: '1px solid #00ff41', borderRadius: '10px' 
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleClick(num)}
            style={{
              width: '50px', height: '50px', borderRadius: '50%',
              border: '2px solid #00ff41',
              background: sequencia.includes(num) ? '#00ff41' : 'transparent',
              color: sequencia.includes(num) ? 'black' : '#00ff41',
              fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer',
              boxShadow: sequencia.includes(num) ? '0 0 15px #00ff41' : 'none',
              transition: '0.2s'
            }}
          >
            {sequencia.indexOf(num) > -1 ? sequencia.indexOf(num) + 1 : ''}
          </button>
        ))}
      </div>
      
      <div style={{display: 'flex', gap: '10px', width: '100%'}}>
        <button type="button" onClick={limpar} className="btn-action" style={{background: 'transparent', border: '1px solid #ff3333', color: '#ff3333'}}>
          LIMPAR
        </button>
        <button type="button" onClick={confirmar} className="btn-action">
          CONFIRMAR
        </button>
      </div>
    </div>
  );
}
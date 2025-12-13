import React from 'react';

export default function Logo({ size = 40 }) {
  // Cor do tema tático
  const neonGreen = "#00ff41";

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      // Efeito de brilho neon
      style={{ filter: 'drop-shadow(0 0 5px rgba(0,255,65,0.6))' }} 
    >
      
      {/* --- ANEL EXTERNO (Gira no sentido anti-horário) --- */}
      <g>
        <circle cx="50" cy="50" r="46" stroke={neonGreen} strokeWidth="1" strokeDasharray="10 15" opacity="0.5" />
        <circle cx="50" cy="50" r="42" stroke={neonGreen} strokeWidth="2" strokeDasharray="20 30" strokeLinecap="round" />
        {/* Animação de Rotação Anti-Horária */}
        <animateTransform 
          attributeName="transform" 
          attributeType="XML" 
          type="rotate" 
          from="360 50 50" 
          to="0 50 50" 
          dur="8s" 
          repeatCount="indefinite" 
        />
      </g>

      {/* --- ANEL INTERNO (Gira no sentido horário) --- */}
      <g>
        <circle cx="50" cy="50" r="30" stroke={neonGreen} strokeWidth="2" strokeDasharray="5 5" />
        {/* Animação de Rotação Horária */}
        <animateTransform 
          attributeName="transform" 
          attributeType="XML" 
          type="rotate" 
          from="0 50 50" 
          to="360 50 50" 
          dur="4s" 
          repeatCount="indefinite" 
        />
      </g>

      {/* --- O CADEADO CENTRAL (Fixo) --- */}
      <g>
        {/* Corpo do Cadeado */}
        <rect x="38" y="45" width="24" height="20" rx="2" stroke={neonGreen} strokeWidth="2" fill="#050505" />
        {/* Haste do Cadeado */}
        <path d="M38 45 V 35 A 12 12 0 0 1 62 35 V 45" stroke={neonGreen} strokeWidth="2" strokeLinecap="round" />
        
        {/* Buraco da Fechadura (Pulsante) */}
        <circle cx="50" cy="53" r="2.5" fill={neonGreen}>
           <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <line x1="50" y1="53" x2="50" y2="60" stroke={neonGreen} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Mira central tática */}
      <line x1="50" y1="5" x2="50" y2="15" stroke={neonGreen} strokeWidth="1" opacity="0.7"/>
      <line x1="50" y1="85" x2="50" y2="95" stroke={neonGreen} strokeWidth="1" opacity="0.7"/>
      <line x1="5" y1="50" x2="15" y2="50" stroke={neonGreen} strokeWidth="1" opacity="0.7"/>
      <line x1="85" y1="50" x2="95" y2="50" stroke={neonGreen} strokeWidth="1" opacity="0.7"/>

    </svg>
  );
}
import React from 'react';

export const ELOLogo = ({ size = 32, className = "" }: { size?: number, className?: string }) => {
    const uniqueId = `elo-${size}`;
    
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                {/* Gradiente principal - Azul claro e vibrante para melhor visibilidade */}
                <linearGradient id={`${uniqueId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60D5FF" />
                    <stop offset="25%" stopColor="#38BDF8" />
                    <stop offset="50%" stopColor="#0EA5E9" />
                    <stop offset="75%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                
                {/* Gradiente de destaque - Azul ainda mais claro */}
                <linearGradient id={`${uniqueId}-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7DD3FC" />
                    <stop offset="50%" stopColor="#60D5FF" />
                    <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
                
                {/* Gradiente para ondas - Mais vibrante */}
                <linearGradient id={`${uniqueId}-wave`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.9" />
                </linearGradient>
                
                {/* Efeito de brilho mais forte */}
                <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                
                {/* Efeito de sombra mais visível */}
                <filter id={`${uniqueId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#38BDF8" floodOpacity="0.5"/>
                </filter>
                
                {/* Gradiente para partículas decorativas */}
                <radialGradient id={`${uniqueId}-particle`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#60D5FF" stopOpacity="0.3" />
                </radialGradient>
            </defs>

            {/* Fundo circular com gradiente suave - mais visível */}
            <circle cx="60" cy="60" r="58" fill={`url(#${uniqueId}-main)`} opacity="0.15" />
            
            {/* Anel decorativo externo duplo */}
            <circle cx="60" cy="60" r="55" fill="none" stroke={`url(#${uniqueId}-accent)`} strokeWidth="1.5" opacity="0.4" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#${uniqueId}-main)`} strokeWidth="1" opacity="0.3" />
            
            {/* Ondas oceânicas decorativas - Mais detalhadas e visíveis */}
            <g opacity="0.7">
                {/* Onda superior */}
                <path
                    d="M 12 42 Q 22 37, 32 42 T 52 42 T 72 42 T 92 42 T 108 42"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M 15 45 Q 25 40, 35 45 T 55 45 T 75 45 T 95 45 T 105 45"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
                
                {/* Onda central */}
                <path
                    d="M 12 57 Q 22 52, 32 57 T 52 57 T 72 57 T 92 57 T 108 57"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M 15 60 Q 25 55, 35 60 T 55 60 T 75 60 T 95 60 T 105 60"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
                
                {/* Onda inferior */}
                <path
                    d="M 12 72 Q 22 67, 32 72 T 52 72 T 72 72 T 92 72 T 108 72"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M 15 75 Q 25 70, 35 75 T 55 75 T 75 75 T 95 75 T 105 75"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            </g>

            {/* Partículas decorativas brilhantes */}
            <g opacity="0.8">
                <circle cx="25" cy="35" r="2" fill={`url(#${uniqueId}-particle)`} />
                <circle cx="95" cy="25" r="2.5" fill={`url(#${uniqueId}-particle)`} />
                <circle cx="105" cy="55" r="2" fill={`url(#${uniqueId}-particle)`} />
                <circle cx="15" cy="65" r="2.5" fill={`url(#${uniqueId}-particle)`} />
                <circle cx="100" cy="95" r="2" fill={`url(#${uniqueId}-particle)`} />
                <circle cx="20" cy="90" r="2.5" fill={`url(#${uniqueId}-particle)`} />
            </g>

            {/* Letra E - Design Premium com azul claro e mais espessa */}
            <g filter={`url(#${uniqueId}-glow)`}>
                {/* Barra vertical esquerda - mais espessa para melhor visibilidade */}
                <path
                    d="M 26 20 L 26 100"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
                {/* Destaque interno na barra vertical */}
                <path
                    d="M 26 20 L 26 100"
                    stroke={`url(#${uniqueId}-accent)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                />
                
                {/* Barra superior - com curva suave */}
                <path
                    d="M 26 20 Q 38 20, 48 20 L 84 20"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
                {/* Destaque interno barra superior */}
                <path
                    d="M 26 20 Q 38 20, 48 20 L 84 20"
                    stroke={`url(#${uniqueId}-accent)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                />
                
                {/* Barra do meio - proporção perfeita */}
                <path
                    d="M 26 60 Q 36 60, 44 60 L 74 60"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
                {/* Destaque interno barra do meio */}
                <path
                    d="M 26 60 Q 36 60, 44 60 L 74 60"
                    stroke={`url(#${uniqueId}-accent)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                />
                
                {/* Barra inferior - simétrica à superior */}
                <path
                    d="M 26 100 Q 38 100, 48 100 L 84 100"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
                {/* Destaque interno barra inferior */}
                <path
                    d="M 26 100 Q 38 100, 48 100 L 84 100"
                    stroke={`url(#${uniqueId}-accent)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                />
            </g>

            {/* Elementos de conexão - muito mais visíveis e detalhados */}
            <g opacity="0.95">
                {/* Círculos de conexão principais - maiores e com borda */}
                <circle cx="94" cy="26" r="10" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                <circle cx="94" cy="26" r="7" fill={`url(#${uniqueId}-main)`} opacity="0.7" />
                <circle cx="94" cy="94" r="10" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                <circle cx="94" cy="94" r="7" fill={`url(#${uniqueId}-main)`} opacity="0.7" />
                
                {/* Linha de conexão principal - mais espessa */}
                <path
                    d="M 84 26 Q 84 46, 84 60 Q 84 74, 84 94"
                    stroke={`url(#${uniqueId}-accent)`}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="none"
                    filter={`url(#${uniqueId}-glow)`}
                />
                {/* Linha de conexão interna - destaque */}
                <path
                    d="M 86 28 Q 86 47, 86 60 Q 86 73, 86 92"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.8"
                />
                
                {/* Pontos de conexão intermediários - maiores */}
                <circle cx="88" cy="46" r="4.5" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                <circle cx="88" cy="46" r="2.5" fill="#FFFFFF" opacity="0.9" />
                <circle cx="88" cy="74" r="4.5" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                <circle cx="88" cy="74" r="2.5" fill="#FFFFFF" opacity="0.9" />
                
                {/* Linhas de conexão entre pontos */}
                <path
                    d="M 84 26 L 88 46"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.6"
                />
                <path
                    d="M 88 46 L 88 74"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.6"
                />
                <path
                    d="M 88 74 L 84 94"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.6"
                />
            </g>

            {/* Brilho adicional no centro - mais pronunciado */}
            <circle cx="60" cy="60" r="48" fill={`url(#${uniqueId}-accent)`} opacity="0.08" />
            <circle cx="60" cy="60" r="40" fill={`url(#${uniqueId}-main)`} opacity="0.05" />
            
            {/* Reflexo de luz no topo */}
            <ellipse cx="60" cy="40" rx="35" ry="15" fill={`url(#${uniqueId}-particle)`} opacity="0.4" />
        </svg>
    );
};

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
                {/* Gradiente principal - Oceano profundo */}
                <linearGradient id={`${uniqueId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0EA5E9" />
                    <stop offset="30%" stopColor="#3B82F6" />
                    <stop offset="70%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                
                {/* Gradiente de destaque */}
                <linearGradient id={`${uniqueId}-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="50%" stopColor="#0EA5E9" />
                    <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                
                {/* Gradiente para ondas */}
                <linearGradient id={`${uniqueId}-wave`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.8" />
                </linearGradient>
                
                {/* Efeito de brilho */}
                <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                
                {/* Efeito de sombra suave */}
                <filter id={`${uniqueId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0EA5E9" floodOpacity="0.3"/>
                </filter>
            </defs>

            {/* Fundo circular com gradiente suave */}
            <circle cx="60" cy="60" r="58" fill={`url(#${uniqueId}-main)`} opacity="0.12" />
            
            {/* Anel decorativo externo */}
            <circle cx="60" cy="60" r="54" fill="none" stroke={`url(#${uniqueId}-main)`} strokeWidth="1" opacity="0.2" />
            
            {/* Ondas oceânicas decorativas - mais elegantes */}
            <g opacity="0.5">
                <path
                    d="M 15 45 Q 25 40, 35 45 T 55 45 T 75 45 T 95 45 T 105 45"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="2.5"
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
                <path
                    d="M 15 75 Q 25 70, 35 75 T 55 75 T 75 75 T 95 75 T 105 75"
                    stroke={`url(#${uniqueId}-wave)`}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            </g>

            {/* Letra E - Design Premium e Moderno */}
            <g filter={`url(#${uniqueId}-glow)`}>
                {/* Barra vertical esquerda - mais espessa e elegante */}
                <path
                    d="M 28 22 L 28 98"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
                
                {/* Barra superior - com curva suave e elegante */}
                <path
                    d="M 28 22 Q 40 22, 50 22 L 82 22"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
                
                {/* Barra do meio - proporção perfeita */}
                <path
                    d="M 28 60 Q 38 60, 46 60 L 72 60"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
                
                {/* Barra inferior - simétrica à superior */}
                <path
                    d="M 28 98 Q 40 98, 50 98 L 82 98"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uniqueId}-shadow)`}
                />
            </g>

            {/* Elementos de conexão - design mais refinado */}
            <g opacity="0.85">
                {/* Círculos de conexão maiores e mais visíveis */}
                <circle cx="92" cy="28" r="8" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                <circle cx="92" cy="92" r="8" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                
                {/* Linha de conexão com curva mais suave */}
                <path
                    d="M 84 28 Q 84 48, 84 60 Q 84 72, 84 92"
                    stroke={`url(#${uniqueId}-accent)`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    filter={`url(#${uniqueId}-glow)`}
                />
                
                {/* Pontos de conexão intermediários - mais visíveis */}
                <circle cx="88" cy="48" r="3.5" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                <circle cx="88" cy="72" r="3.5" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
            </g>

            {/* Brilho adicional no centro */}
            <circle cx="60" cy="60" r="45" fill={`url(#${uniqueId}-main)`} opacity="0.05" />
        </svg>
    );
};

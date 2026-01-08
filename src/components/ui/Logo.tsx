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
                {/* Gradiente principal - Azul moderno e profissional */}
                <linearGradient id={`${uniqueId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0EA5E9" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
                
                {/* Gradiente de destaque */}
                <linearGradient id={`${uniqueId}-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60D5FF" />
                    <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
                
                {/* Efeito de brilho sutil */}
                <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                
                {/* Sombra profissional */}
                <filter id={`${uniqueId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0EA5E9" floodOpacity="0.4"/>
                </filter>
            </defs>

            {/* Fundo circular sutil */}
            <circle cx="60" cy="60" r="56" fill={`url(#${uniqueId}-main)`} opacity="0.1" />
            
            {/* Anel decorativo */}
            <circle cx="60" cy="60" r="52" fill="none" stroke={`url(#${uniqueId}-main)`} strokeWidth="1" opacity="0.2" />
            
            {/* Letra E - Design moderno e minimalista */}
            <g filter={`url(#${uniqueId}-glow)`}>
                {/* Barra vertical esquerda */}
                <rect
                    x="28"
                    y="22"
                    width="12"
                    height="76"
                    rx="6"
                    fill={`url(#${uniqueId}-main)`}
                    filter={`url(#${uniqueId}-shadow)`}
                />
                
                {/* Barra superior */}
                <rect
                    x="28"
                    y="22"
                    width="54"
                    height="12"
                    rx="6"
                    fill={`url(#${uniqueId}-main)`}
                    filter={`url(#${uniqueId}-shadow)`}
                />
                
                {/* Barra do meio */}
                <rect
                    x="28"
                    y="54"
                    width="42"
                    height="12"
                    rx="6"
                    fill={`url(#${uniqueId}-main)`}
                    filter={`url(#${uniqueId}-shadow)`}
                />
                
                {/* Barra inferior */}
                <rect
                    x="28"
                    y="86"
                    width="54"
                    height="12"
                    rx="6"
                    fill={`url(#${uniqueId}-main)`}
                    filter={`url(#${uniqueId}-shadow)`}
                />
            </g>

            {/* Elementos de conexão - design minimalista e profissional */}
            <g opacity="0.9">
                {/* Círculos de conexão */}
                <circle cx="92" cy="28" r="8" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                <circle cx="92" cy="92" r="8" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
                
                {/* Linha de conexão */}
                <line
                    x1="86"
                    y1="28"
                    x2="86"
                    y2="92"
                    stroke={`url(#${uniqueId}-accent)`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter={`url(#${uniqueId}-glow)`}
                />
                
                {/* Ponto central de conexão */}
                <circle cx="86" cy="60" r="5" fill={`url(#${uniqueId}-accent)`} filter={`url(#${uniqueId}-glow)`} />
            </g>

            {/* Reflexo de luz sutil */}
            <ellipse cx="60" cy="35" rx="28" ry="8" fill="white" opacity="0.15" />
        </svg>
    );
};

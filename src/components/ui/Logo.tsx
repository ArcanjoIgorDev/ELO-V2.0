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
                <linearGradient id={`${uniqueId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0EA5E9" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
                <linearGradient id={`${uniqueId}-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
                <linearGradient id={`${uniqueId}-wave`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
                </linearGradient>
                <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Fundo com gradiente suave e ondas */}
            <circle cx="60" cy="60" r="56" fill={`url(#${uniqueId}-main)`} opacity="0.15" />
            
            {/* Ondas decorativas no fundo */}
            <path
                d="M 20 50 Q 30 45, 40 50 T 60 50 T 80 50 T 100 50"
                stroke={`url(#${uniqueId}-wave)`}
                strokeWidth="2"
                fill="none"
                opacity="0.4"
            />
            <path
                d="M 20 70 Q 30 65, 40 70 T 60 70 T 80 70 T 100 70"
                stroke={`url(#${uniqueId}-wave)`}
                strokeWidth="2"
                fill="none"
                opacity="0.3"
            />
            
            {/* Círculo de borda com gradiente */}
            <circle cx="60" cy="60" r="50" fill="none" stroke={`url(#${uniqueId}-main)`} strokeWidth="1.5" opacity="0.25" />

            {/* Letra E estilizada - design moderno e fluido */}
            <g filter={`url(#${uniqueId}-glow)`}>
                {/* Barra vertical esquerda com gradiente */}
                <path
                    d="M 30 25 L 30 95"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Barra superior - curva suave e moderna */}
                <path
                    d="M 30 25 Q 42 25, 52 25 L 78 25"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Barra do meio - mais curta e elegante */}
                <path
                    d="M 30 60 Q 40 60, 48 60 L 68 60"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Barra inferior - curva suave */}
                <path
                    d="M 30 95 Q 42 95, 52 95 L 78 95"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>

            {/* Elementos decorativos - ondas/conexões melhoradas */}
            <circle cx="90" cy="32" r="7" fill={`url(#${uniqueId}-accent)`} opacity="0.9" />
            <circle cx="90" cy="88" r="7" fill={`url(#${uniqueId}-accent)`} opacity="0.9" />
            
            {/* Linha de conexão com curva suave */}
            <path
                d="M 83 32 Q 83 50, 83 60 Q 83 70, 83 88"
                stroke={`url(#${uniqueId}-accent)`}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
                fill="none"
            />
            
            {/* Pequenos pontos de conexão */}
            <circle cx="86" cy="50" r="2.5" fill={`url(#${uniqueId}-accent)`} opacity="0.7" />
            <circle cx="86" cy="70" r="2.5" fill={`url(#${uniqueId}-accent)`} opacity="0.7" />
        </svg>
    );
};

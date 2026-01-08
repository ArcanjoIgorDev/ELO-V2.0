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
                <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Fundo com gradiente suave */}
            <circle cx="60" cy="60" r="55" fill={`url(#${uniqueId}-main)`} opacity="0.12" />
            
            {/* Círculo de borda */}
            <circle cx="60" cy="60" r="50" fill="none" stroke={`url(#${uniqueId}-main)`} strokeWidth="1.2" opacity="0.2" />

            {/* Letra E estilizada - design mais orgânico */}
            <g filter={`url(#${uniqueId}-glow)`}>
                {/* Barra vertical esquerda */}
                <path
                    d="M 32 28 L 32 92"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                
                {/* Barra superior - com curva suave */}
                <path
                    d="M 32 28 Q 45 28 55 28 L 75 28"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                
                {/* Barra do meio */}
                <path
                    d="M 32 60 Q 42 60 50 60 L 65 60"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                
                {/* Barra inferior - com curva suave */}
                <path
                    d="M 32 92 Q 45 92 55 92 L 75 92"
                    stroke={`url(#${uniqueId}-main)`}
                    strokeWidth="7"
                    strokeLinecap="round"
                />
            </g>

            {/* Elementos decorativos - ondas/conexões */}
            <circle cx="88" cy="35" r="6" fill={`url(#${uniqueId}-accent)`} opacity="0.8" />
            <circle cx="88" cy="85" r="6" fill={`url(#${uniqueId}-accent)`} opacity="0.8" />
            
            {/* Linha de conexão com curva */}
            <path
                d="M 82 35 Q 82 60 82 85"
                stroke={`url(#${uniqueId}-accent)`}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.5"
            />
        </svg>
    );
};

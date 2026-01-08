import React from 'react';

export const ELOLogo = ({ size = 32, className = "" }: { size?: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <defs>
            <linearGradient id="elo-gradient-main" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="elo-gradient-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
            <filter id="elo-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* Fundo circular sutil */}
        <circle cx="60" cy="60" r="52" fill="url(#elo-gradient-main)" opacity="0.08" />
        
        {/* Círculo interno com borda */}
        <circle cx="60" cy="60" r="48" fill="none" stroke="url(#elo-gradient-main)" strokeWidth="1.5" opacity="0.15" />

        {/* Estrutura principal - letra "E" estilizada como ondas */}
        <path
            d="M 30 35 L 30 85 M 30 35 L 70 35 L 60 50 L 50 50 M 30 60 L 60 60 M 30 85 L 70 85 L 60 70 L 50 70"
            stroke="url(#elo-gradient-main)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#elo-glow-soft)"
        />

        {/* Elemento decorativo - conexão */}
        <circle cx="85" cy="40" r="8" fill="url(#elo-gradient-accent)" opacity="0.7" filter="url(#elo-glow-soft)" />
        <circle cx="85" cy="80" r="8" fill="url(#elo-gradient-accent)" opacity="0.7" filter="url(#elo-glow-soft)" />
        
        {/* Linha conectando os elementos decorativos */}
        <path
            d="M 75 40 Q 75 60 75 80"
            stroke="url(#elo-gradient-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
        />
    </svg>
);

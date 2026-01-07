import React from 'react';

export const ELOLogo = ({ size = 32, className = "" }: { size?: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <defs>
            <linearGradient id="elo_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Fundo de brilho suave */}
        <circle cx="256" cy="256" r="200" fill="url(#elo_grad)" fillOpacity="0.1" />

        {/* O Símbolo ELO - Fluidez Oceânica */}
        <path
            d="M384 256C384 326.69 326.69 384 256 384C185.31 384 128 326.69 128 256C128 185.31 185.31 128 256 128C326.69 128 384 185.31 384 256Z"
            stroke="url(#elo_grad)"
            strokeWidth="40"
            strokeLinecap="round"
            filter="url(#glow)"
        />

        <path
            d="M256 128C185.31 128 128 185.31 128 256"
            stroke="white"
            strokeWidth="40"
            strokeLinecap="round"
            strokeDasharray="20 40"
            opacity="0.8"
        />

        {/* Círculo Interno que sugere conexão */}
        <circle cx="256" cy="256" r="60" fill="white" fillOpacity="0.9" />
        <circle cx="256" cy="256" r="30" fill="url(#elo_grad)" />
    </svg>
);

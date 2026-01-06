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
        <rect width="512" height="512" rx="128" fill="url(#paint0_linear)" />
        <path fillRule="evenodd" clipRule="evenodd" d="M256 96C202.981 96 160 138.981 160 192C160 228.6 180.9 260.6 211.5 276.9L160 368H208L232 304H280L304 368H352L300.5 276.9C331.1 260.6 352 228.6 352 192C352 138.981 309.019 96 256 96ZM256 240C229.49 240 208 218.51 208 192C208 165.49 229.49 144 256 144C282.51 144 304 165.49 304 192C304 218.51 282.51 240 256 240Z" fill="white" />
        <defs>
            <linearGradient id="paint0_linear" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0EA5E9" />
                <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
    </svg>
);

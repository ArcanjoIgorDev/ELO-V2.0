import React from 'react';

interface AvatarProps {
  url?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ url, alt, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const fallbackUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${alt}`;

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-white/10 bg-midnight-950 flex-shrink-0 shadow-lg`}>
      <img
        src={url || fallbackUrl}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
};

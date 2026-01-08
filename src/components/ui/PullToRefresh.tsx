
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !refreshing) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - startY;

    if (startY > 0 && deltaY > 0 && window.scrollY === 0 && !refreshing) {
      // Resistência ao puxar
      setCurrentY(Math.min(deltaY * 0.5, 120)); 
    }
  };

  const handleTouchEnd = async () => {
    if (currentY > THRESHOLD && !refreshing) {
      setRefreshing(true);
      setCurrentY(60); // Mantém o loader visível
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setCurrentY(0);
          setStartY(0);
        }, 500);
      }
    } else {
      setCurrentY(0);
      setStartY(0);
    }
  };

  return (
    <div 
      ref={contentRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100%' }}
    >
      <div 
        className="fixed top-16 left-0 w-full flex justify-center z-20 pointer-events-none transition-transform duration-300"
        style={{ 
          transform: `translateY(${currentY > 0 ? currentY - 40 : -100}px)`,
          opacity: currentY > 0 ? 1 : 0
        }}
      >
        <div className="bg-midnight-900 border border-white/10 rounded-full p-2 shadow-xl">
          <Loader2 
            className={`text-primary ${refreshing ? 'animate-spin' : ''}`} 
            size={24} 
            style={{ transform: `rotate(${currentY * 2}deg)` }}
          />
        </div>
      </div>
      <div 
        style={{ 
          transform: `translateY(${currentY}px)`,
          transition: refreshing ? 'transform 0.3s cubic-bezier(0.1, 1, 0.1, 1)' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

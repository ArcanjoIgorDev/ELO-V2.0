import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-safe left-0 right-0 p-4 pointer-events-none flex flex-col items-center gap-2 z-[10000]">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md animate-slide-up bg-midnight-900/90
              ${toast.type === 'success' ? 'border-green-500/20 text-green-200' : ''}
              ${toast.type === 'error' ? 'border-red-500/20 text-red-200' : ''}
              ${toast.type === 'info' ? 'border-primary/20 text-blue-200' : ''}
              max-w-sm w-full
            `}
                    >
                        {toast.type === 'success' && <CheckCircle className="shrink-0 text-green-500" size={20} />}
                        {toast.type === 'error' && <AlertCircle className="shrink-0 text-red-500" size={20} />}
                        {toast.type === 'info' && <Info className="shrink-0 text-primary" size={20} />}

                        <p className="flex-1 text-sm font-medium">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

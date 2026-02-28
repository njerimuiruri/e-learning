"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext({ showToast: (_message, _options = {}) => {} });

const typeStyles = {
    success: {
        icon: CheckCircle2,
        container: "bg-emerald-600/95 text-white",
        progress: "bg-white/70",
    },
    error: {
        icon: XCircle,
        container: "bg-red-600/95 text-white",
        progress: "bg-white/70",
    },
    warning: {
        icon: AlertTriangle,
        container: "bg-amber-500/95 text-white",
        progress: "bg-white/70",
    },
    info: {
        icon: Info,
        container: "bg-slate-800/95 text-white",
        progress: "bg-white/70",
    },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, options = {}) => {
        const { type = "info", duration = 2800, title } = options;
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type, title }]);
        setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-[320px] max-w-[90vw]">
                {toasts.map((toast) => {
                    const style = typeStyles[toast.type] || typeStyles.info;
                    const Icon = style.icon;
                    return (
                        <div
                            key={toast.id}
                            className={`rounded-xl shadow-lg px-4 py-3 border border-white/10 ${style.container}`}
                        >
                            <div className="flex items-start gap-3">
                                <Icon className="w-5 h-5 shrink-0" />
                                <div className="flex-1">
                                    {toast.title && <p className="text-sm font-semibold leading-tight">{toast.title}</p>}
                                    <p className="text-sm leading-snug">{toast.message}</p>
                                </div>
                                <button
                                    aria-label="Dismiss notification"
                                    onClick={() => removeToast(toast.id)}
                                    className="text-white/80 hover:text-white text-sm"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);

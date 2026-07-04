import { createContext, useCallback, useContext, useState } from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import "./Toast.css";

const ToastContext = createContext(null);

const ICONS = {
  error:   <AlertCircle size={16} strokeWidth={2} />,
  success: <CheckCircle2 size={16} strokeWidth={2} />,
  info:    <Info size={16} strokeWidth={2} />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const toast = {
    error:   (msg, duration) => add(msg, "error",   duration),
    success: (msg, duration) => add(msg, "success", duration),
    info:    (msg, duration) => add(msg, "info",    duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

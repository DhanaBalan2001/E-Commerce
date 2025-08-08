import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, variant = 'info', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, variant, duration };
    
    setToasts(prev => [...prev, toast]);

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message) => addToast(message, 'success', 3000), [addToast]);
  const error = useCallback((message) => addToast(message, 'danger'), [addToast]);
  const warning = useCallback((message) => addToast(message, 'warning'), [addToast]);
  const info = useCallback((message) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            bg={toast.variant}
            onClose={() => removeToast(toast.id)}
            show={true}
            delay={toast.duration}
            autohide
          >
            <Toast.Body className="text-white">
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

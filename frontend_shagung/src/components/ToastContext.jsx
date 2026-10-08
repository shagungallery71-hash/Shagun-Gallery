import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { message, type }

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type })
    if (duration > 0) {
      setTimeout(() => setToast(null), duration)
    }
  }, [])

  const value = { showToast }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
          <div
            className={`rounded-lg px-6 py-3 shadow-xl text-sm text-white min-w-[200px] text-center animate-in slide-in-from-top-2 duration-300 ${toast.type === 'error'
                ? 'bg-red-600'
                : toast.type === 'success'
                  ? 'bg-green-600'
                  : 'bg-gray-900/90'
              }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

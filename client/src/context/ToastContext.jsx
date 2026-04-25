import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

const BORDER = { success: 'border-l-green-500', error: 'border-l-red-500', info: 'border-l-brand-pink' }

function Toast({ message, type }) {
  return (
    <div className={`bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-2xl max-w-xs
                     border-l-4 animate-slide-up ${BORDER[type] ?? BORDER.info}`}>
      {message}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map(t => <Toast key={t.id} {...t} />)}
      </div>
    </ToastContext.Provider>
  )
}

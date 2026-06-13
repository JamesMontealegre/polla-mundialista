import useInstallPrompt from '../hooks/useInstallPrompt'

export default function InstallBanner() {
  const { showBanner, isIos, install, dismissBanner } = useInstallPrompt()

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gray-900 border-t border-wc-gold/30 shadow-2xl">
      <div className="max-w-md mx-auto">
        {isIos ? (
          /* iOS: instrucciones manuales */
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">📲</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Instala la app</p>
              <p className="text-gray-400 text-xs mt-1">
                Toca{' '}
                <span className="inline-flex items-center align-middle">
                  <svg className="w-4 h-4 text-blue-400 inline" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l-2 2h-1v6h2V6.41l3.3 3.3 1.4-1.42L12 4.59 8.29 8.29l1.42 1.42L12 7.41V10h2V4h-1L12 2zM5 12v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8h-2v8H7v-8H5z"/>
                  </svg>
                </span>
                {' '}(Compartir) y luego <strong className="text-white">Agregar a pantalla de inicio</strong>
              </p>
            </div>
            <button
              onClick={dismissBanner}
              className="text-gray-500 text-xs px-2 py-1.5 shrink-0 hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          /* Android/Desktop: boton de instalacion directa */
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">📲</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Instala la app</p>
              <p className="text-gray-400 text-xs">
                Accede más rápido y recibe notificaciones.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={dismissBanner}
                className="text-gray-500 text-xs px-2 py-1.5 hover:text-gray-300 transition-colors"
              >
                Ahora no
              </button>
              <button
                onClick={install}
                className="bg-wc-gold text-wc-dark font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Instalar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

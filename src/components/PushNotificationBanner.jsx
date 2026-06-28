import { useAuth } from '../contexts/AuthContext'
import usePushNotifications from '../hooks/usePushNotifications'

export default function PushNotificationBanner() {
  const { user } = useAuth()
  const { showBanner, requestPermission, dismissBanner, loading } = usePushNotifications(user)

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gray-900 border-t border-wc-green/50 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Activa las notificaciones</p>
          <p className="text-gray-400 text-xs">
            Recibe alertas de partidos y resultados en tu teléfono.
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
            onClick={requestPermission}
            disabled={loading}
            className="bg-wc-gold text-wc-dark font-bold text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 hover:bg-yellow-400 transition-colors"
          >
            {loading ? '...' : 'Activar'}
          </button>
        </div>
      </div>
    </div>
  )
}

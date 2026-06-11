import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const TYPE_ICONS = {
  info: '📢',
  payment: '💰',
  followup: '⚽',
}

function timeAgo(date) {
  const now = Date.now()
  const ts = date instanceof Date ? date.getTime() : new Date(date).getTime()
  const diff = Math.floor((now - ts) / 1000)
  if (diff < 60) return 'Ahora'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const { user, unreadCount } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadNotifications() {
    if (!user) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'userNotifications'),
        where('userId', '==', user.uid)
      )
      const snap = await getDocs(q)
      const docs = snap.docs.map(d => ({ docId: d.id, ...d.data() }))
      // Ordenar por fecha descendente en cliente (evita necesidad de índice compuesto)
      docs.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
      setNotifications(docs)
    } catch (err) {
      console.error('Error cargando notificaciones:', err)
    }
    setLoading(false)
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) return
    try {
      await Promise.all(
        unread.map(n => updateDoc(doc(db, 'userNotifications', n.docId), { read: true }))
      )
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marcando como leídas:', err)
    }
  }

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  // Al abrir, marcar como leídas después de un breve delay
  useEffect(() => {
    if (open && notifications.length > 0 && notifications.some(n => !n.read)) {
      const timer = setTimeout(markAllRead, 1500)
      return () => clearTimeout(timer)
    }
  }, [open, notifications])

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-gray-300 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-wc-dark" />
        )}
      </button>

      {open && (
        <>
          {/* Overlay para cerrar */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel: full-screen en móvil, dropdown en desktop */}
          <div className="fixed inset-x-0 top-14 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-[70vh] sm:rounded-xl bg-gray-900 border-t sm:border border-gray-700 shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
              <span className="text-white font-bold text-sm">Notificaciones</span>
              <div className="flex items-center gap-3">
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-wc-gold hover:text-yellow-300 transition-colors"
                  >
                    Marcar como leídas
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-white text-lg sm:hidden"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center text-gray-500 text-sm py-8">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-gray-500 text-sm">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map(n => {
                  const ts = n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt
                  return (
                    <div
                      key={n.docId}
                      className={`px-4 py-3 border-b border-gray-800 ${
                        !n.read ? 'bg-gray-800/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg shrink-0">{TYPE_ICONS[n.type] || '📢'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm truncate">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 bg-wc-gold rounded-full shrink-0" />}
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-gray-600 text-xs mt-1 block">{ts ? timeAgo(ts) : ''}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

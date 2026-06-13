import { useState, useEffect, useCallback } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, getMessagingInstance } from '../firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
const DISMISS_KEY = 'push_banner_dismissed_at'
const DISMISS_DAYS = 7

// Hash simple para crear un ID estable por token
function hashToken(token) {
  let hash = 0
  for (let i = 0; i < Math.min(token.length, 32); i++) {
    hash = ((hash << 5) - hash) + token.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export default function usePushNotifications(user) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(false)

  // Registrar token FCM en Firestore
  const registerToken = useCallback(async (uid) => {
    try {
      const messaging = await getMessagingInstance()
      if (!messaging) return

      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      )

      // Esperar a que el service worker este activo antes de pedir el token
      if (!registration.active) {
        await new Promise((resolve) => {
          const sw = registration.installing || registration.waiting
          if (!sw) { resolve(); return }
          sw.addEventListener('statechange', function handler() {
            if (sw.state === 'activated') {
              sw.removeEventListener('statechange', handler)
              resolve()
            }
          })
        })
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        const tokenDocId = `${uid}_${hashToken(token)}`
        await setDoc(doc(db, 'fcmTokens', tokenDocId), {
          userId: uid,
          token,
          createdAt: serverTimestamp(),
          lastRefreshed: serverTimestamp(),
          userAgent: navigator.userAgent,
        }, { merge: true })
      }
    } catch (err) {
      console.error('Error registrando FCM token:', err)
    }
  }, [])

  // Determinar si mostrar el banner de opt-in
  useEffect(() => {
    if (!user) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return // Ya concedido o denegado

    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24)
      if (daysSince < DISMISS_DAYS) return
    }

    // Mostrar banner despues de 5 segundos
    const timer = setTimeout(() => setShowBanner(true), 5000)
    return () => clearTimeout(timer)
  }, [user])

  // Si el permiso ya esta concedido, registrar token silenciosamente
  useEffect(() => {
    if (user && permission === 'granted') {
      registerToken(user.uid)
    }
  }, [user, permission, registerToken])

  // Escuchar mensajes en primer plano (foreground)
  useEffect(() => {
    if (permission !== 'granted') return
    let unsubscribe

    async function setup() {
      const messaging = await getMessagingInstance()
      if (!messaging) return
      unsubscribe = onMessage(messaging, (payload) => {
        // El sistema in-app (onSnapshot en AuthContext) ya maneja la UI
        // Aqui solo logueamos para debug
        console.log('[FCM] Mensaje en primer plano:', payload)
      })
    }
    setup()
    return () => unsubscribe?.()
  }, [permission])

  // Pedir permiso de notificaciones
  const requestPermission = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        await registerToken(user.uid)
        setShowBanner(false)
      }
    } catch (err) {
      console.error('Error pidiendo permiso de notificaciones:', err)
    }
    setLoading(false)
  }, [user, registerToken])

  // Descartar banner por 7 dias
  const dismissBanner = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setShowBanner(false)
  }, [])

  return { permission, showBanner, requestPermission, dismissBanner, loading }
}

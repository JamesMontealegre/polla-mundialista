import { useState, useEffect, useCallback } from 'react'

const DISMISS_KEY = 'install_banner_dismissed_at'
const DISMISS_DAYS = 3

// Detectar si la app ya esta instalada (standalone mode)
function isAppInstalled() {
  // iOS: navigator.standalone
  if (window.navigator.standalone === true) return true
  // Android/Desktop: display-mode: standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // TWA (Trusted Web Activity)
  if (document.referrer.includes('android-app://')) return true
  return false
}

// Detectar si es iOS
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Detectar si es Safari en iOS (no Chrome, no Firefox)
function isIOSSafari() {
  return isIOS() && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
}

export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null) // Android/desktop
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Si ya esta instalada, no mostrar nada
    if (isAppInstalled()) return

    // Verificar si fue descartado recientemente
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24)
      if (daysSince < DISMISS_DAYS) return
    }

    // iOS: mostrar instrucciones manuales (solo en Safari)
    if (isIOS()) {
      if (isIOSSafari()) {
        setIsIos(true)
        const timer = setTimeout(() => setShowBanner(true), 3000)
        return () => clearTimeout(timer)
      }
      return // En Chrome/Firefox iOS no se puede instalar PWA
    }

    // Android/Desktop: escuchar evento beforeinstallprompt
    function handleBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Si la app fue instalada despues de mostrar el banner
    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  // Android/Desktop: disparar prompt de instalacion nativo
  const install = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  // Descartar banner por N dias
  const dismissBanner = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setShowBanner(false)
  }, [])

  return { showBanner, isIos, install, dismissBanner }
}

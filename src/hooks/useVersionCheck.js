import { useEffect, useRef } from 'react'

const CHECK_INTERVAL = 60_000 // Cada 60 segundos

export default function useVersionCheck() {
  const currentVersion = useRef(null)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/version.json?t=' + Date.now())
        if (!res.ok) return
        const { v } = await res.json()
        if (currentVersion.current === null) {
          // Primera carga: guardar version actual
          currentVersion.current = v
          return
        }
        if (v !== currentVersion.current) {
          // Nueva version detectada: recargar
          window.location.reload()
        }
      } catch {
        // Silenciar errores de red
      }
    }

    check()
    const id = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(id)
  }, [])
}

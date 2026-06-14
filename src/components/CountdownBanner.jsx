import { useState, useEffect } from 'react'

function useCountdown(deadline) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()))
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => {
      const diff = Math.max(0, deadline - Date.now())
      setRemaining(diff)
      if (diff <= 0) clearInterval(id)
    }, 60_000)
    return () => clearInterval(id)
  }, [deadline])
  const totalMin = Math.floor(remaining / 60_000)
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  return { days, hours, expired: remaining <= 0 }
}

export default function CountdownBanner({ deadline }) {
  const { days, hours, expired } = useCountdown(deadline)
  if (expired) return null
  return (
    <div className="bg-gray-900 rounded-xl border border-purple-800/50 p-4 text-center animate-pulse mb-4">
      <div className="text-gray-400 text-xs mb-1.5">Tiempo restante para predecir</div>
      <div className="flex items-center justify-center gap-3">
        <div>
          <div className="text-white font-black text-2xl font-mono">{days}</div>
          <div className="text-gray-500 text-[10px] uppercase">días</div>
        </div>
        <div className="text-gray-600 text-xl font-bold">:</div>
        <div>
          <div className="text-white font-black text-2xl font-mono">{String(hours).padStart(2, '0')}</div>
          <div className="text-gray-500 text-[10px] uppercase">horas</div>
        </div>
      </div>
    </div>
  )
}

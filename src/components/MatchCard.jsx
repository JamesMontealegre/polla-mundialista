import { useState, useEffect } from 'react'
import { FLAGS, hasMatchStarted, STAGE_NAMES } from '../data/matches'
import { calculatePoints } from '../utils/scoring'

// Formatea fecha en hora Colombia
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MatchCard({
  match,
  prediction,
  onPredict,
  onReset,
  showResult = false,
  isLive = false,
}) {
  const [timeLeft, setTimeLeft] = useState(null) // seconds until cutoff
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const started = hasMatchStarted(match)
  const hasResult = match.team1Goals !== null && match.team1Goals !== undefined
  const predType = prediction?.predictionType || 'score'
  const hasPrediction = prediction && (
    predType === 'outcome'
      ? prediction.outcome != null
      : prediction.team1Goals !== undefined
  )

  // Countdown timer: locks predictions 5 min before match start
  useEffect(() => {
    const cutoff = new Date(new Date(match.date).getTime() - 5 * 60 * 1000)
    const cleanups = []

    function tick() {
      const diff = Math.floor((cutoff - Date.now()) / 1000)
      setTimeLeft(diff > 0 ? diff : 0)
    }

    tick()
    const diff = Math.floor((cutoff - Date.now()) / 1000)

    if (diff <= 0) {
      // Already past cutoff
    } else if (diff <= 300) {
      // Within 5 min window: tick every second
      const id = setInterval(tick, 1000)
      cleanups.push(() => clearInterval(id))
    } else {
      // More than 5 min away: schedule a timeout to start the countdown
      const delay = (diff - 300) * 1000
      const timeoutId = setTimeout(() => {
        tick()
        const id = setInterval(tick, 1000)
        cleanups.push(() => clearInterval(id))
      }, delay)
      cleanups.push(() => clearTimeout(timeoutId))
    }

    return () => cleanups.forEach(fn => fn())
  }, [match.date])

  // Calcula puntos si hay resultado y predicción
  let pointsResult = null
  if (hasResult && hasPrediction) {
    pointsResult = calculatePoints(prediction, { team1Goals: match.team1Goals, team2Goals: match.team2Goals })
  }

  const isPDef = match.team1 === 'Por definir' || match.team2 === 'Por definir'

  // Is this match today (Colombia timezone) and not yet started?
  const isToday = (() => {
    const now = new Date()
    const matchDate = new Date(match.date)
    const fmt = d => d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    return fmt(now) === fmt(matchDate)
  })()
  const isTodayUpcoming = isToday && !started

  // Formato del countdown mm:ss
  const countdownLabel = timeLeft != null && timeLeft > 0 && timeLeft <= 300
    ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
    : null

  // Etiqueta de predicción
  const predLabel = () => {
    if (!hasPrediction) return null
    if (predType === 'outcome') {
      if (prediction.outcome === 'team1') return `${FLAGS[match.team1] || ''} Gana`
      if (prediction.outcome === 'team2') return `${FLAGS[match.team2] || ''} Gana`
      return 'Empate'
    }
    return `${prediction.team1Goals}-${prediction.team2Goals}`
  }

  return (
    <div className={`bg-gray-900 rounded-xl border ${
      isLive ? 'border-green-500/40 match-live'
      : match.isFinished ? 'border-wc-green'
      : isTodayUpcoming ? 'border-purple-500/40 match-today'
      : 'border-gray-700'
    } overflow-hidden transition-all hover:border-gray-500`}>
      {/* Header */}
      <div className="bg-gray-800 px-3 py-1.5 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {match.group ? `Grupo ${match.group} · J${match.matchday}` : STAGE_NAMES[match.stage]}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            EN VIVO
          </span>
        ) : (
          <span className="text-xs text-gray-400">{formatDate(match.date)}</span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <div className="text-2xl mb-1">{FLAGS[match.team1] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm leading-tight min-h-[2.5rem] flex items-center justify-center">{match.team1}</div>
          </div>

          {/* Score / Status */}
          <div className="flex flex-col items-center gap-1 min-w-[90px]">
            {hasResult ? (
              <div className="flex items-center gap-2">
                <span className={`font-black text-2xl ${isLive ? 'text-green-400' : 'text-wc-gold'}`}>{match.team1Goals}</span>
                <span className="text-gray-500 font-bold">-</span>
                <span className={`font-black text-2xl ${isLive ? 'text-green-400' : 'text-wc-gold'}`}>{match.team2Goals}</span>
              </div>
            ) : isLive ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-black text-2xl">0</span>
                <span className="text-gray-600 font-bold">-</span>
                <span className="text-gray-500 font-black text-2xl">0</span>
              </div>
            ) : (
              <div className="text-gray-500 font-bold text-xl">VS</div>
            )}

            {/* Predicción */}
            {hasPrediction && (
              <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                hasResult
                  ? pointsResult.points >= 3 ? 'bg-green-900 text-green-300'
                    : pointsResult.points >= 1 ? 'bg-yellow-900 text-yellow-300'
                    : 'bg-red-900 text-red-300'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                <span>👤 {predLabel()}</span>
                {hasResult && <span className="font-bold">+{pointsResult.points}pts</span>}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <div className="text-2xl mb-1">{FLAGS[match.team2] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm leading-tight min-h-[2.5rem] flex items-center justify-center">{match.team2}</div>
          </div>
        </div>

        {/* City */}
        <div className="text-center text-xs text-gray-500 mt-2">📍 {match.city}</div>

        {/* CTA Button */}
        {isLive && (
          <div className="mt-3">
            <div className="w-full py-2 rounded-lg text-sm font-semibold bg-green-900/30 text-green-400/60 text-center border border-green-800/30 cursor-not-allowed">
              En curso
            </div>
          </div>
        )}
        {!isLive && !isPDef && onPredict && (
          <div className="mt-3">
            {started || timeLeft === 0 ? (
              <div className="text-center text-xs text-gray-500 italic">
                Pronóstico cerrado
              </div>
            ) : (
              <>
                {hasPrediction ? (
                  showResetConfirm ? (
                    <div className="bg-gray-800 rounded-lg p-3 border border-red-800">
                      <p className="text-xs text-gray-300 text-center mb-2">¿Eliminar tu predicción para este partido?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="flex-1 py-1.5 rounded-lg border border-gray-600 text-gray-300 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => { onReset(match.id); setShowResetConfirm(false) }}
                          className="flex-1 py-1.5 rounded-lg bg-red-700 text-white text-xs font-bold hover:bg-red-600"
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onPredict(match)}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold bg-wc-green text-white hover:bg-green-700 transition-all"
                      >
                        ✏️ Cambiar
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="py-2 px-3 rounded-lg text-xs font-semibold border border-gray-600 text-gray-400 hover:border-red-800 hover:text-red-400 transition-all"
                      >
                        Restablecer
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => onPredict(match)}
                    className="w-full py-2 rounded-lg text-sm font-semibold bg-wc-gold text-wc-dark hover:bg-yellow-400 transition-all"
                  >
                    🔮 Predecir resultado
                  </button>
                )}
                {countdownLabel && (
                  <div className="mt-1.5 text-center text-xs font-mono font-bold text-red-400 animate-pulse">
                    ⏱️ Cierra en {countdownLabel}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

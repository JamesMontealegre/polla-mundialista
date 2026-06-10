import { FLAGS, hasMatchStarted, STAGE_NAMES } from '../data/matches'

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
  showResult = false,
}) {
  const started = hasMatchStarted(match)
  const hasResult = match.team1Goals !== null && match.team1Goals !== undefined
  const hasPrediction = prediction && prediction.team1Goals !== undefined

  // Calcula puntos si hay resultado y predicción
  let points = null
  let correctWinner = false
  let correctScore = false
  if (hasResult && hasPrediction) {
    const pOutcome = getOutcome(prediction.team1Goals, prediction.team2Goals)
    const rOutcome = getOutcome(match.team1Goals, match.team2Goals)
    correctWinner = pOutcome === rOutcome
    correctScore = prediction.team1Goals === match.team1Goals && prediction.team2Goals === match.team2Goals
    points = (correctWinner ? 0.5 : 0) + (correctScore ? 0.5 : 0)
  }

  function getOutcome(g1, g2) {
    if (g1 > g2) return 'team1'
    if (g2 > g1) return 'team2'
    return 'draw'
  }

  const isPDef = match.team1 === 'Por definir'

  return (
    <div className={`bg-gray-900 rounded-xl border ${hasResult ? 'border-wc-green' : 'border-gray-700'} overflow-hidden transition-all hover:border-gray-500`}>
      {/* Header */}
      <div className="bg-gray-800 px-3 py-1.5 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {match.group ? `Grupo ${match.group} · J${match.matchday}` : STAGE_NAMES[match.stage]}
        </span>
        <span className="text-xs text-gray-400">{formatDate(match.date)}</span>
      </div>

      {/* Teams + Score */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <div className="text-2xl mb-1">{FLAGS[match.team1] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm leading-tight">{match.team1}</div>
          </div>

          {/* Score / Status */}
          <div className="flex flex-col items-center gap-1 min-w-[90px]">
            {hasResult ? (
              <div className="flex items-center gap-2">
                <span className="text-wc-gold font-black text-2xl">{match.team1Goals}</span>
                <span className="text-gray-500 font-bold">-</span>
                <span className="text-wc-gold font-black text-2xl">{match.team2Goals}</span>
              </div>
            ) : (
              <div className="text-gray-500 font-bold text-xl">VS</div>
            )}

            {/* Predicción */}
            {hasPrediction && (
              <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                hasResult
                  ? points === 1 ? 'bg-green-900 text-green-300'
                    : points === 0.5 ? 'bg-yellow-900 text-yellow-300'
                    : 'bg-red-900 text-red-300'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                <span>👤 {prediction.team1Goals}-{prediction.team2Goals}</span>
                {hasResult && <span className="font-bold">+{points}pts</span>}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <div className="text-2xl mb-1">{FLAGS[match.team2] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm leading-tight">{match.team2}</div>
          </div>
        </div>

        {/* City */}
        <div className="text-center text-xs text-gray-500 mt-2">📍 {match.city}</div>

        {/* CTA Button */}
        {!isPDef && onPredict && (
          <div className="mt-3">
            {started ? (
              <div className="text-center text-xs text-gray-500 italic">
                Partido en curso o finalizado
              </div>
            ) : (
              <button
                onClick={() => onPredict(match)}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                  hasPrediction
                    ? 'bg-wc-green text-white hover:bg-green-700'
                    : 'bg-wc-gold text-wc-dark hover:bg-yellow-400'
                }`}
              >
                {hasPrediction ? '✏️ Cambiar predicción' : '🔮 Predecir resultado'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

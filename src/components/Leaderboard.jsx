export default function Leaderboard({ scores, currentUserId, confirmedMemberCount = 0, totalMemberCount = 0, isPaid = true }) {
  const CUOTA_POZO = 25000
  const totalPozo = confirmedMemberCount * CUOTA_POZO
  const estimatedPozo = totalMemberCount * CUOTA_POZO
  const allPaid = confirmedMemberCount >= totalMemberCount

  if (!scores || scores.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Aún no hay puntuaciones.</p>
        <p className="text-sm mt-1">¡Empieza a hacer predicciones!</p>
      </div>
    )
  }

  const paymentOrder = { confirmed: 0, uploaded: 1, pending: 2, rejected: 3 }

  const sorted = [...scores].sort((a, b) => {
    // Solo ordenar por pago en grupos de pago
    if (isPaid) {
      const pa = paymentOrder[a.paymentStatus] ?? 2
      const pb = paymentOrder[b.paymentStatus] ?? 2
      if (pa !== pb) return pa - pb
    }
    // Luego: por puntos y desempate
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.correctScores !== a.correctScores) return b.correctScores - a.correctScores
    if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners
    return (a.avgTimestamp || Infinity) - (b.avgTimestamp || Infinity)
  })

  const medals = ['🥇', '🥈', '🥉']

  const fmt = (n) => `$${n.toLocaleString('es-CO')}`

  return (
    <div className="space-y-2">
      {/* Prize pool (solo grupos de pago) */}
      {isPaid && confirmedMemberCount > 0 && (
        <div className="bg-gradient-to-r from-wc-green/20 to-wc-gold/10 rounded-xl border border-wc-green/40 p-4 mb-2">
          <div className="text-center mb-3">
            <div className="text-gray-400 text-xs uppercase tracking-wider">Pozo de premios</div>
            <div className="text-wc-gold font-black text-2xl">{fmt(totalPozo)}</div>
            <div className="text-gray-400 text-xs">{confirmedMemberCount} participante{confirmedMemberCount !== 1 ? 's' : ''} confirmado{confirmedMemberCount !== 1 ? 's' : ''}</div>
            {!allPaid && totalMemberCount > 0 && (
              <div className="text-gray-500 text-xs mt-1">
                Estimado con {totalMemberCount} inscritos: <span className="text-gray-300 font-semibold">{fmt(estimatedPozo)}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800/60 rounded-lg p-2">
              <div className="text-sm">🥇</div>
              <div className="text-white font-bold text-sm">{fmt(Math.round(totalPozo * 0.5))}</div>
              <div className="text-gray-500 text-xs">50%</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-2">
              <div className="text-sm">🥈</div>
              <div className="text-white font-bold text-sm">{fmt(Math.round(totalPozo * 0.3))}</div>
              <div className="text-gray-500 text-xs">30%</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-2">
              <div className="text-sm">🥉</div>
              <div className="text-white font-bold text-sm">{fmt(Math.round(totalPozo * 0.2))}</div>
              <div className="text-gray-500 text-xs">20%</div>
            </div>
          </div>
        </div>
      )}

      {sorted.map((entry, idx) => {
        const isMe = entry.uid === currentUserId
        const medal = medals[idx] || `${idx + 1}`
        const isTop3 = idx < 3

        return (
          <div
            key={entry.uid}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              isMe
                ? 'bg-wc-green/20 border-wc-green'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            {/* Position */}
            <div className={`w-8 text-center font-black text-lg ${isTop3 ? '' : 'text-gray-500'}`}>
              {medal}
            </div>

            {/* Avatar */}
            {entry.photoURL ? (
              <img src={entry.photoURL} alt={entry.displayName} className="w-9 h-9 rounded-full border border-gray-600" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-wc-green flex items-center justify-center text-white font-bold text-sm">
                {entry.displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm truncate ${isMe ? 'text-wc-gold' : 'text-white'}`}>
                {entry.displayName} {isMe && '(tú)'}
              </div>
              {isPaid && (
                <div className="text-xs">
                  {entry.paymentStatus === 'confirmed'
                    ? <span className="text-green-400">Pago confirmado</span>
                    : <span className="text-yellow-400">Pago pendiente</span>
                  }
                </div>
              )}
            </div>

            {/* Points */}
            <div className="text-right">
              <div className={`font-black text-xl ${isTop3 ? 'text-wc-gold' : 'text-white'}`}>
                {entry.totalPoints.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

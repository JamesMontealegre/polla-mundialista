export default function Leaderboard({ scores, currentUserId }) {
  if (!scores || scores.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Aún no hay puntuaciones.</p>
        <p className="text-sm mt-1">¡Empieza a hacer predicciones!</p>
      </div>
    )
  }

  const sorted = [...scores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.correctScores !== a.correctScores) return b.correctScores - a.correctScores
    return b.correctWinners - a.correctWinners
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-2">
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
              <div className="text-xs text-gray-400">
                {entry.correctWinners} ganadores · {entry.correctScores} exactos
              </div>
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

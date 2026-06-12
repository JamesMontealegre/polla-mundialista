import { useMemo } from 'react'

const CONFETTI_COLORS = ['#ffd700','#ff6b6b','#4ecdc4','#a78bfa','#f97316','#34d399','#60a5fa','#f472b6','#fbbf24','#c084fc','#fb923c','#2dd4bf']
const PARTICLE_COUNT = 50

function ConfettiCannon() {
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = -20 - Math.random() * 140           // -20 to -160 deg (wider spread)
      const speed = 80 + Math.random() * 140             // more distance
      const rad = (angle * Math.PI) / 180
      const tx = Math.cos(rad) * speed
      const ty = Math.sin(rad) * speed
      const rot = Math.random() * 1080 - 540
      const delay = Math.random() * 0.8
      const dur = 2.5 + Math.random() * 1.5
      const size = 4 + Math.random() * 5                // 4-9px
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
      const isRect = Math.random() > 0.4                // more rectangles
      return { tx, ty, rot, delay, dur, size, color, isRect, id: i }
    }), [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`,
            width: p.isRect ? `${p.size}px` : `${p.size * 0.7}px`,
            height: p.isRect ? `${p.size * 0.4}px` : `${p.size * 0.7}px`,
            borderRadius: p.isRect ? '1px' : '50%',
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  )
}

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
    // Menor NP = mejor (menos partidos sin participar)
    if ((a.noParticipation ?? 0) !== (b.noParticipation ?? 0)) return (a.noParticipation ?? 0) - (b.noParticipation ?? 0)
    // Mayor anticipación = mejor
    if ((b.anticipation ?? 0) !== (a.anticipation ?? 0)) return (b.anticipation ?? 0) - (a.anticipation ?? 0)
    return (a.avgTimestamp || Infinity) - (b.avgTimestamp || Infinity)
  })

  const medals = ['🥇', '🥈', '🥉']

  const fmt = (n) => `$${n.toLocaleString('es-CO')}`

  return (
    <div className="space-y-2">
      {/* Prize pool (solo grupos de pago) */}
      {isPaid && confirmedMemberCount > 0 && (
        <div className="prize-celebration bg-gradient-to-r from-wc-green/20 to-wc-gold/10 rounded-xl border border-wc-green/40 p-4 mb-2">
          <ConfettiCannon />
          <div className="text-center mb-3 relative">
            <div className="text-gray-400 text-xs uppercase tracking-wider">Pozo de premios</div>
            <div className="text-wc-gold font-black text-2xl">{fmt(totalPozo)}</div>
            <div className="text-gray-400 text-xs">{confirmedMemberCount} participante{confirmedMemberCount !== 1 ? 's' : ''} confirmado{confirmedMemberCount !== 1 ? 's' : ''}</div>
            {!allPaid && totalMemberCount > 0 && (
              <div className="text-gray-500 text-xs mt-1">
                Estimado con {totalMemberCount} inscritos: <span className="text-gray-300 font-semibold">{fmt(estimatedPozo)}</span>
              </div>
            )}
          </div>
          {/* Podio */}
          <div className="flex items-end justify-center gap-1.5 relative">
            {/* 2do lugar — izquierda */}
            <div className="flex flex-col items-center flex-1">
              <div className="text-lg mb-1">🥈</div>
              <div className="text-white font-bold text-xs">{fmt(Math.round(totalPozo * 0.3))}</div>
              <div className="text-gray-500 text-[10px] mb-1.5">30%</div>
              <div className="w-full h-14 bg-gray-400/20 border border-gray-400/40 rounded-t-lg flex items-center justify-center">
                <span className="text-gray-300 font-black text-lg">2</span>
              </div>
            </div>
            {/* 1er lugar — centro */}
            <div className="flex flex-col items-center flex-1">
              <div className="text-lg mb-1">🥇</div>
              <div className="text-white font-bold text-xs">{fmt(Math.round(totalPozo * 0.5))}</div>
              <div className="text-gray-500 text-[10px] mb-1.5">50%</div>
              <div className="w-full h-20 bg-yellow-500/20 border border-yellow-500/40 rounded-t-lg flex items-center justify-center">
                <span className="text-wc-gold font-black text-lg">1</span>
              </div>
            </div>
            {/* 3er lugar — derecha */}
            <div className="flex flex-col items-center flex-1">
              <div className="text-lg mb-1">🥉</div>
              <div className="text-white font-bold text-xs">{fmt(Math.round(totalPozo * 0.2))}</div>
              <div className="text-gray-500 text-[10px] mb-1.5">20%</div>
              <div className="w-full h-10 bg-amber-700/20 border border-amber-700/40 rounded-t-lg flex items-center justify-center">
                <span className="text-amber-500 font-black text-lg">3</span>
              </div>
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
              idx === 0 ? 'medal-gold border-yellow-600/50'
              : idx === 1 ? 'medal-silver border-gray-400/40'
              : idx === 2 ? 'medal-bronze border-amber-700/50'
              : isMe ? 'bg-wc-green/20 border-wc-green'
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

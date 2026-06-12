export default function StatsTable({ scores, currentUserId }) {
  if (!scores || scores.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Aun no hay estadisticas.</p>
        <p className="text-sm mt-1">Las estadisticas se actualizan con los partidos jugados.</p>
      </div>
    )
  }

  const sorted = [...scores].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.correctScores !== a.correctScores) return b.correctScores - a.correctScores
    if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners
    if ((a.noParticipation ?? 0) !== (b.noParticipation ?? 0)) return (a.noParticipation ?? 0) - (b.noParticipation ?? 0)
    if ((b.anticipation ?? 0) !== (a.anticipation ?? 0)) return (b.anticipation ?? 0) - (a.anticipation ?? 0)
    return (b.avgAnticipationHours ?? 0) - (a.avgAnticipationHours ?? 0)
  })

  const showFinalist = scores.some(s => s.finalistBonus != null && s.finalistBonus > 0)

  const columns = [
    { key: 'correctWinners', label: 'PG', title: 'Partidos ganados', color: 'text-white' },
    { key: 'correctScores', label: 'PE', title: 'Partidos exactos', color: 'text-green-400' },
    { key: 'noParticipation', label: 'NP', title: 'No participación', color: 'text-red-400' },
    { key: 'anticipation', label: 'AN', title: 'Anticipación (primer predictor correcto)', color: 'text-blue-400' },
    ...(showFinalist ? [{ key: 'finalistBonus', label: 'F', title: 'Bonus finalistas (+15)', color: 'text-purple-400' }] : []),
    { key: 'totalPoints', label: 'P', title: 'Puntos totales', color: 'text-wc-gold font-bold' },
  ]

  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-8" />
          <col />
          {columns.map(col => (
            <col key={col.key} className="w-10" />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-gray-800">
            <th className="py-2.5 px-1 text-center text-gray-500 text-xs">#</th>
            <th className="py-2.5 px-2 text-left text-gray-400 text-xs uppercase tracking-wider truncate">
              Participante
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                className="py-2.5 px-1 text-center text-gray-400 text-xs uppercase tracking-wider"
                title={col.title}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, idx) => {
            const isMe = entry.uid === currentUserId
            const medalEmoji = { 0: '🥇', 1: '🥈', 2: '🥉' }
            const rowBg = isMe ? 'bg-wc-green/20' : idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/40'
            return (
              <tr
                key={entry.uid}
                className={`border-t border-gray-700/50 ${rowBg}`}
              >
                <td className="py-2 px-1 text-center font-mono text-xs">
                  {medalEmoji[idx] || <span className="text-gray-500">{idx + 1}</span>}
                </td>
                <td className="py-2 px-2 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {entry.photoURL ? (
                      <img src={entry.photoURL} alt={entry.displayName} className="w-6 h-6 rounded-full shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-wc-green flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {entry.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className={`truncate text-sm ${
                      isMe ? 'text-wc-gold font-semibold' : 'text-white'
                    }`}>
                      {entry.displayName}
                      {isMe && <span className="text-xs ml-0.5 opacity-70">(tu)</span>}
                    </span>
                  </div>
                </td>
                {columns.map(col => (
                  <td key={col.key} className={`py-2 px-1 text-center font-mono text-sm ${col.color}`}>
                    {entry[col.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Leyenda */}
      <div className="bg-gray-800/60 border-t border-gray-700 px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span><span className="text-white">PG</span> Ganados</span>
        <span><span className="text-green-400">PE</span> Exactos</span>
        <span><span className="text-red-400">NP</span> Sin participar</span>
        <span><span className="text-blue-400">AN</span> Anticipación</span>
        {showFinalist && <span><span className="text-purple-400">F</span> Finalistas</span>}
        <span><span className="text-wc-gold">P</span> Puntos</span>
      </div>
    </div>
  )
}

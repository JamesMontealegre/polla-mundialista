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
    return (a.avgTimestamp || Infinity) - (b.avgTimestamp || Infinity)
  })

  const columns = [
    { key: 'correctWinners', label: 'PG', title: 'Partidos ganados', color: 'text-white' },
    { key: 'correctScores', label: 'PE', title: 'Partidos exactos', color: 'text-green-400' },
    { key: 'noParticipation', label: 'NP', title: 'No participación', color: 'text-red-400' },
    { key: 'anticipation', label: 'AN', title: 'Anticipación', color: 'text-blue-400' },
    { key: 'totalPoints', label: 'P', title: 'Puntos totales', color: 'text-wc-gold font-bold' },
  ]

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="bg-gray-800">
            <th className="py-2.5 px-2 text-center text-gray-500 text-xs w-8">#</th>
            <th className="py-2.5 px-3 text-left text-gray-400 text-xs uppercase tracking-wider">
              Participante
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                className="py-2.5 px-2 text-center text-gray-400 text-xs uppercase tracking-wider"
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
            return (
              <tr
                key={entry.uid}
                className={`border-t border-gray-700/50 ${
                  isMe ? 'bg-wc-green/20' : idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/40'
                }`}
              >
                <td className="py-2.5 px-2 text-center text-gray-500 font-mono text-xs">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {entry.photoURL ? (
                      <img src={entry.photoURL} alt={entry.displayName} className="w-6 h-6 rounded-full shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-wc-green flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {entry.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className={`truncate max-w-[130px] text-sm ${
                      isMe ? 'text-wc-gold font-semibold' : 'text-white'
                    }`}>
                      {entry.displayName}
                      {isMe && <span className="text-xs ml-1 opacity-70">(tu)</span>}
                    </span>
                  </div>
                </td>
                {columns.map(col => (
                  <td key={col.key} className={`py-2.5 px-2 text-center font-mono text-sm ${col.color}`}>
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
        <span><span className="text-wc-gold">P</span> Puntos</span>
      </div>
    </div>
  )
}

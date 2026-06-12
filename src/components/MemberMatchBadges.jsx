import { FLAGS } from '../data/matches'
import { calculatePoints } from '../utils/scoring'

export default function MemberMatchBadges({ matches, memberPredictions, matchResults }) {
  if (!matches || matches.length === 0) return null

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pt-2 pb-0.5">
      {matches.map(match => {
        const result = matchResults[match.id]
        const prediction = memberPredictions?.[match.id]
        const isFinished = result?.isFinished

        const flag1 = FLAGS[result?.team1 || match.team1] || '🏳️'
        const flag2 = FLAGS[result?.team2 || match.team2] || '🏳️'

        // No finalizado: solo banderas
        if (!isFinished) {
          return (
            <div
              key={match.id}
              className="flex-shrink-0 flex items-center gap-0.5 bg-gray-800 rounded-lg px-1.5 py-1 text-xs"
              title={`${match.team1} vs ${match.team2}`}
            >
              <span>{flag1}</span>
              <span className="text-gray-500 text-[10px]">v</span>
              <span>{flag2}</span>
            </div>
          )
        }

        // Finalizado sin prediccion
        const hasPrediction = prediction && (
          prediction.predictionType === 'outcome'
            ? prediction.outcome != null
            : prediction.team1Goals != null
        )

        if (!hasPrediction) {
          return (
            <div
              key={match.id}
              className="flex-shrink-0 flex items-center gap-0.5 bg-gray-800 rounded-lg px-1.5 py-1 text-xs border border-red-900/50"
              title={`${match.team1} vs ${match.team2} (no predijo)`}
            >
              <span className="opacity-40">{flag1}</span>
              <span className="text-gray-600 text-[10px]">v</span>
              <span className="opacity-40">{flag2}</span>
              <span className="text-red-400 text-[10px] ml-0.5">NP</span>
            </div>
          )
        }

        // Finalizado con prediccion
        const { points } = calculatePoints(prediction, {
          team1Goals: result.team1Goals,
          team2Goals: result.team2Goals,
        })

        let predLabel
        if (prediction.predictionType === 'outcome') {
          const team1Name = result?.team1 || match.team1
          const team2Name = result?.team2 || match.team2
          if (prediction.outcome === 'team1') predLabel = `G ${team1Name}`
          else if (prediction.outcome === 'team2') predLabel = `G ${team2Name}`
          else predLabel = 'Empate'
        } else {
          predLabel = `${prediction.team1Goals}-${prediction.team2Goals}`
        }

        const pointsColor = points >= 3
          ? 'border-green-600 bg-green-900/30'
          : points >= 1
            ? 'border-yellow-600 bg-yellow-900/30'
            : 'border-red-800 bg-red-900/30'

        const pointsTextColor = points >= 3
          ? 'text-green-400'
          : points >= 1
            ? 'text-yellow-400'
            : 'text-red-400'

        return (
          <div
            key={match.id}
            className={`flex-shrink-0 flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-xs border ${pointsColor}`}
            title={`${match.team1} ${result.team1Goals}-${result.team2Goals} ${match.team2} | Prediccion: ${predLabel} | +${points}pts`}
          >
            <span>{flag1}</span>
            <span className="text-gray-300 font-mono text-[10px]">{predLabel}</span>
            <span>{flag2}</span>
            <span className={`font-bold text-[10px] ml-0.5 ${pointsTextColor}`}>+{points}</span>
          </div>
        )
      })}
    </div>
  )
}

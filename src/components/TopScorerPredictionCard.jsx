import { useState } from 'react'
import { ALL_TEAMS, FLAGS } from '../data/matches'

function checkTopScorer(pred, result) {
  if (!result || !pred) return null
  const teamCorrect = pred.team === result.team
  const jerseyCorrect = String(pred.jerseyNumber) === String(result.jerseyNumber)
  const goalsCorrect = String(pred.goals) === String(result.goals)
  return {
    teamCorrect,
    jerseyCorrect,
    goalsCorrect,
    points: (goalsCorrect ? 3 : 0) + (teamCorrect ? 1 : 0) + (jerseyCorrect ? 1 : 0),
  }
}

export default function TopScorerPredictionCard({
  prediction,
  onSave,
  isLocked,
  isRevealed,
  allPredictions,
  visibleMembers,
  currentUserId,
  topScorerResult,
  paymentBlocked = false,
  onPaymentRequired,
  paymentBlockedMessage = 'Confirma tu pago para habilitar esta predicción',
}) {
  const [team, setTeam] = useState(prediction?.team || '')
  const [jerseyNumber, setJerseyNumber] = useState(prediction?.jerseyNumber || '')
  const [goals, setGoals] = useState(prediction?.goals || '')
  const [saving, setSaving] = useState(false)

  const isValid = team && jerseyNumber && goals
  const hasChanged = team !== (prediction?.team || '')
    || String(jerseyNumber) !== String(prediction?.jerseyNumber || '')
    || String(goals) !== String(prediction?.goals || '')

  async function handleSave() {
    if (!isValid || saving) return
    setSaving(true)
    await onSave(team, jerseyNumber, goals)
    setSaving(false)
  }

  const myResult = topScorerResult ? checkTopScorer(prediction, topScorerResult) : null

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
          <span className="text-xl">🧙</span> Tu predicción
        </div>

        {paymentBlocked ? (
          <div className="bg-gray-800 rounded-lg p-4 text-center space-y-3">
            <p className="text-gray-400 text-sm">{paymentBlockedMessage}</p>
            {onPaymentRequired && (
              <button
                onClick={onPaymentRequired}
                className="w-full py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm hover:bg-yellow-400 transition-colors"
              >
                💳 Ir a pagos
              </button>
            )}
          </div>
        ) : !isLocked ? (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Seleccionado</label>
                <select
                  value={team}
                  onChange={e => setTeam(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none"
                >
                  <option value="">Seleccionar equipo...</option>
                  {ALL_TEAMS.map(t => (
                    <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Número de camiseta</label>
                <select
                  value={jerseyNumber}
                  onChange={e => setJerseyNumber(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none"
                >
                  <option value="">Seleccionar número...</option>
                  {Array.from({ length: 99 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Goles en el torneo</label>
                <select
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none"
                >
                  <option value="">Seleccionar goles...</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!isValid || saving || !hasChanged}
              className="w-full mt-3 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50 hover:bg-yellow-400 transition-colors"
            >
              {saving ? 'Guardando...' : prediction ? 'Actualizar predicción' : 'Guardar predicción'}
            </button>

            {prediction && (
              <p className="text-gray-500 text-xs mt-2 text-center">
                Puedes cambiar tu predicción hasta el cierre indicado
              </p>
            )}
          </>
        ) : prediction ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{FLAGS[prediction.team] || '🏳️'}</span>
              <div>
                <div className="text-white font-semibold">{prediction.team}</div>
                <div className="text-gray-400 text-sm">
                  Camiseta #{prediction.jerseyNumber} · {prediction.goals} goles
                </div>
              </div>
            </div>
            {myResult !== null ? (
              <div className="space-y-1 mt-2 border-t border-gray-700 pt-2">
                <div className={`text-xs ${myResult.goalsCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                  {myResult.goalsCorrect ? '✓ Goles correctos +3 pts' : '✗ Goles incorrectos'}
                </div>
                <div className={`text-xs ${myResult.teamCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                  {myResult.teamCorrect ? '✓ Seleccionado correcto +1 pt' : '✗ Seleccionado incorrecto'}
                </div>
                <div className={`text-xs ${myResult.jerseyCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                  {myResult.jerseyCorrect ? '✓ Camiseta correcta +1 pt' : '✗ Camiseta incorrecta'}
                </div>
                {myResult.points > 0 && (
                  <div className="text-sm font-bold text-green-400">🎉 +{myResult.points} pts</div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-xs mt-1">Predicción cerrada</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">No realizaste predicción del goleador</p>
          </div>
        )}
      </div>

      {/* Predicciones del grupo (cuando se revela) */}
      {isRevealed && allPredictions && visibleMembers && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="text-white font-bold text-sm mb-3">Predicciones del grupo</div>
          <div className="space-y-2">
            {visibleMembers.map(m => {
              const pred = allPredictions[m.uid]
              const isMe = m.uid === currentUserId
              const res = topScorerResult ? checkTopScorer(pred, topScorerResult) : null

              return (
                <div
                  key={m.uid}
                  className={`flex items-center gap-3 rounded-lg p-2.5 ${isMe ? 'bg-wc-green/20' : 'bg-gray-800'}`}
                >
                  {m.photoURL ? (
                    <img src={m.photoURL} alt={m.displayName} className="w-8 h-8 rounded-full border border-gray-600" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-wc-green flex items-center justify-center text-white text-xs font-bold">
                      {m.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold truncate">
                      {m.displayName}
                      {isMe && <span className="text-wc-gold ml-1">(tú)</span>}
                    </div>
                    {pred ? (
                      <div className="text-gray-400 text-xs mt-0.5">
                        {FLAGS[pred.team] || '🏳️'} {pred.team} · #{pred.jerseyNumber} · {pred.goals} goles
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">No predijo</span>
                    )}
                  </div>
                  {res !== null && (
                    <span className={`text-xs font-bold shrink-0 ${res.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {res.points > 0 ? `+${res.points}` : '0'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { ALL_TEAMS, FLAGS } from '../data/matches'

function checkResult(pred, finalResult) {
  if (!finalResult || !pred) return null
  const actual = new Set([finalResult.team1, finalResult.team2])
  const predicted = new Set([pred.finalTeam1, pred.finalTeam2])
  const teamsCorrect = actual.size === 2 && predicted.size === 2 && [...predicted].every(t => actual.has(t))
  const actualWinner = finalResult.team1Goals > finalResult.team2Goals ? finalResult.team1
    : finalResult.team2Goals > finalResult.team1Goals ? finalResult.team2
    : null
  const resultCorrect = Boolean(actualWinner && pred.winner === actualWinner)
  return { teamsCorrect, resultCorrect, points: (teamsCorrect ? 3 : 0) + (resultCorrect ? 3 : 0) }
}

export default function FinalPredictionCard({
  prediction,
  onSave,
  isLocked,
  isRevealed,
  allFinalPredictions,
  visibleMembers,
  currentUserId,
  finalResult,
  label1 = 'Equipo 1',
  label2 = 'Equipo 2',
  paymentBlocked = false,
  onPaymentRequired,
}) {
  const [team1, setTeam1] = useState(prediction?.finalTeam1 || '')
  const [team2, setTeam2] = useState(prediction?.finalTeam2 || '')
  const [winner, setWinner] = useState(prediction?.winner || '')
  const [saving, setSaving] = useState(false)

  const isValid = team1 && team2 && team1 !== team2 && winner
  const hasChanged = team1 !== (prediction?.finalTeam1 || '')
    || team2 !== (prediction?.finalTeam2 || '')
    || winner !== (prediction?.winner || '')

  function handleTeam1Change(val) {
    setTeam1(val)
    if (winner !== team2) setWinner('')
  }
  function handleTeam2Change(val) {
    setTeam2(val)
    if (winner !== team1) setWinner('')
  }

  async function handleSave() {
    if (!isValid || saving) return
    setSaving(true)
    await onSave(team1, team2, winner)
    setSaving(false)
  }

  const myResult = finalResult ? checkResult(prediction, finalResult) : null

  return (
    <div className="space-y-4">
      {/* Mi prediccion */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
          <span className="text-xl">🧙</span> Tu predicción
        </div>

        {paymentBlocked ? (
          <div className="bg-gray-800 rounded-lg p-4 text-center space-y-3">
            <p className="text-gray-400 text-sm">Confirma tu pago para habilitar esta predicción</p>
            <button
              onClick={onPaymentRequired}
              className="w-full py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm hover:bg-yellow-400 transition-colors"
            >
              💳 Ir a pagos
            </button>
          </div>
        ) : !isLocked ? (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">{label1}</label>
                <select
                  value={team1}
                  onChange={e => handleTeam1Change(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none"
                >
                  <option value="">Seleccionar equipo...</option>
                  {ALL_TEAMS.filter(t => t !== team2).map(t => (
                    <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                  ))}
                </select>
              </div>
              <div className="text-center text-gray-500 text-xs font-bold">VS</div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">{label2}</label>
                <select
                  value={team2}
                  onChange={e => handleTeam2Change(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none"
                >
                  <option value="">Seleccionar equipo...</option>
                  {ALL_TEAMS.filter(t => t !== team1).map(t => (
                    <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                  ))}
                </select>
              </div>

              {team1 && team2 && team1 !== team2 && (
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">¿Quién gana?</label>
                  <div className="flex gap-2">
                    {[team1, team2].map(t => (
                      <button
                        key={t}
                        onClick={() => setWinner(t)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                          winner === t
                            ? 'bg-wc-gold/20 border-wc-gold text-wc-gold'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <span>{FLAGS[t] || '🏳️'}</span>
                        <span className="truncate">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-center">
                <div className="text-3xl">{FLAGS[prediction.finalTeam1]}</div>
                <div className="text-white text-sm font-semibold mt-1">{prediction.finalTeam1}</div>
              </div>
              <div className="text-gray-500 font-bold">VS</div>
              <div className="text-center">
                <div className="text-3xl">{FLAGS[prediction.finalTeam2]}</div>
                <div className="text-white text-sm font-semibold mt-1">{prediction.finalTeam2}</div>
              </div>
            </div>
            {prediction.winner && (
              <p className="text-gray-400 text-xs text-center mb-2">
                Ganador: {FLAGS[prediction.winner]} {prediction.winner}
              </p>
            )}
            {myResult !== null ? (
              <div className="space-y-1 mt-2">
                <div className={`text-xs text-center ${myResult.teamsCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                  {myResult.teamsCorrect ? '✓ Equipos correctos +3 pts' : '✗ Equipos incorrectos'}
                </div>
                <div className={`text-xs text-center ${myResult.resultCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                  {myResult.resultCorrect ? '✓ Resultado correcto +3 pts' : '✗ Resultado incorrecto'}
                </div>
                {myResult.points > 0 && (
                  <div className="text-sm font-bold text-green-400 text-center">🎉 +{myResult.points} pts</div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center">Predicción cerrada</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">No realizaste esta predicción</p>
          </div>
        )}
      </div>

      {/* Predicciones de otros (solo cuando revelado) */}
      {isRevealed && allFinalPredictions && visibleMembers && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="text-white font-bold text-sm mb-3">Predicciones del grupo</div>
          <div className="space-y-2">
            {visibleMembers.map(m => {
              const pred = allFinalPredictions[m.uid]
              const isMe = m.uid === currentUserId
              const res = finalResult ? checkResult(pred, finalResult) : null

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
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-sm">{FLAGS[pred.finalTeam1]}</span>
                        <span className="text-gray-300 text-xs">{pred.finalTeam1}</span>
                        <span className="text-gray-500 text-[10px] mx-0.5">vs</span>
                        <span className="text-gray-300 text-xs">{pred.finalTeam2}</span>
                        <span className="text-sm">{FLAGS[pred.finalTeam2]}</span>
                        {pred.winner && (
                          <span className="text-gray-500 text-[10px]">· gana {pred.winner}</span>
                        )}
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

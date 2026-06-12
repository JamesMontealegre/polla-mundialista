import { useState, useEffect } from 'react'
import { ALL_TEAMS, FLAGS } from '../data/matches'

function useCountdown(deadline) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline - Date.now()))
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => {
      const diff = Math.max(0, deadline - Date.now())
      setRemaining(diff)
      if (diff <= 0) clearInterval(id)
    }, 60_000)
    return () => clearInterval(id)
  }, [deadline])
  const totalMin = Math.floor(remaining / 60_000)
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const minutes = totalMin % 60
  return { days, hours, minutes, expired: remaining <= 0 }
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
  deadline,
}) {
  const [team1, setTeam1] = useState(prediction?.finalTeam1 || '')
  const [team2, setTeam2] = useState(prediction?.finalTeam2 || '')
  const [saving, setSaving] = useState(false)
  const countdown = useCountdown(deadline)

  const hasChanged = team1 !== (prediction?.finalTeam1 || '') || team2 !== (prediction?.finalTeam2 || '')
  const isValid = team1 && team2 && team1 !== team2

  async function handleSave() {
    if (!isValid || saving) return
    setSaving(true)
    await onSave(team1, team2)
    setSaving(false)
  }

  // Evaluar si acerto los finalistas
  function checkFinalists(pred) {
    if (!finalResult || !pred) return null
    const actual = new Set([finalResult.team1, finalResult.team2])
    const predicted = new Set([pred.finalTeam1, pred.finalTeam2])
    if (actual.size === 2 && predicted.size === 2) {
      const match = [...predicted].every(t => actual.has(t))
      return match
    }
    return false
  }

  const myResult = finalResult ? checkFinalists(prediction) : null

  return (
    <div className="space-y-4">
      {/* Countdown */}
      {!countdown.expired && (
        <div className="bg-gray-900 rounded-xl border border-purple-800/50 p-4 text-center animate-pulse">
          <div className="text-gray-400 text-xs mb-1.5">Tiempo restante para predecir</div>
          <div className="flex items-center justify-center gap-3">
            <div>
              <div className="text-white font-black text-2xl font-mono">{countdown.days}</div>
              <div className="text-gray-500 text-[10px] uppercase">dias</div>
            </div>
            <div className="text-gray-600 text-xl font-bold">:</div>
            <div>
              <div className="text-white font-black text-2xl font-mono">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-gray-500 text-[10px] uppercase">horas</div>
            </div>
          </div>
        </div>
      )}

      {/* Mi prediccion */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="text-white font-bold text-sm mb-3">Tu prediccion</div>

        {!isLocked ? (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Finalista 1</label>
                <select
                  value={team1}
                  onChange={e => setTeam1(e.target.value)}
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
                <label className="text-gray-400 text-xs mb-1 block">Finalista 2</label>
                <select
                  value={team2}
                  onChange={e => setTeam2(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none"
                >
                  <option value="">Seleccionar equipo...</option>
                  {ALL_TEAMS.filter(t => t !== team1).map(t => (
                    <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                  ))}
                </select>
              </div>
            </div>

            {isValid && team1 && team2 && (
              <div className="mt-3 bg-gray-800 rounded-lg p-3 text-center">
                <span className="text-2xl">{FLAGS[team1]}</span>
                <span className="text-white font-bold text-sm mx-3">{team1}</span>
                <span className="text-gray-500 text-xs">vs</span>
                <span className="text-white font-bold text-sm mx-3">{team2}</span>
                <span className="text-2xl">{FLAGS[team2]}</span>
              </div>
            )}

            {team1 && team2 && team1 === team2 && (
              <p className="text-red-400 text-xs mt-2 text-center">Debes elegir dos equipos diferentes</p>
            )}

            <button
              onClick={handleSave}
              disabled={!isValid || saving || !hasChanged}
              className="w-full mt-3 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50 hover:bg-yellow-400 transition-colors"
            >
              {saving ? 'Guardando...' : prediction ? 'Actualizar prediccion' : 'Guardar prediccion'}
            </button>

            {prediction && (
              <p className="text-gray-500 text-xs mt-2 text-center">
                Puedes cambiar tu prediccion hasta el cierre de la fase de grupos
              </p>
            )}
          </>
        ) : prediction ? (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-4">
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
            {myResult !== null && (
              <div className={`mt-3 text-sm font-bold ${myResult ? 'text-green-400' : 'text-red-400'}`}>
                {myResult ? '🎉 ¡Acertaste los finalistas! +15 pts' : 'No acertaste los finalistas'}
              </div>
            )}
            <p className="text-gray-500 text-xs mt-2">Prediccion cerrada</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">No realizaste prediccion de la final</p>
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
              const correct = finalResult ? checkFinalists(pred) : null

              return (
                <div
                  key={m.uid}
                  className={`flex items-center gap-3 rounded-lg p-2.5 ${
                    isMe ? 'bg-wc-green/20' : 'bg-gray-800'
                  }`}
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
                      {isMe && <span className="text-wc-gold ml-1">(tu)</span>}
                    </div>
                    {pred ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-sm">{FLAGS[pred.finalTeam1]}</span>
                        <span className="text-gray-300 text-xs">{pred.finalTeam1}</span>
                        <span className="text-gray-500 text-[10px] mx-0.5">vs</span>
                        <span className="text-gray-300 text-xs">{pred.finalTeam2}</span>
                        <span className="text-sm">{FLAGS[pred.finalTeam2]}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">No predijo</span>
                    )}
                  </div>
                  {correct !== null && (
                    <span className={`text-xs font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>
                      {correct ? '+15' : '0'}
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

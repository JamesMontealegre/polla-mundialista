import { useState } from 'react'
import { FLAGS } from '../data/matches'

export default function PredictionModal({ match, existing, onSave, onClose }) {
  // Determine initial prediction type
  const initialType = existing?.predictionType || 'score'
  const [predType, setPredType] = useState(initialType)

  // Score prediction state — always store as string for consistent validation
  const [g1, setG1] = useState(existing?.team1Goals != null ? String(existing.team1Goals) : '')
  const [g2, setG2] = useState(existing?.team2Goals != null ? String(existing.team2Goals) : '')

  // Outcome prediction state
  const [outcome, setOutcome] = useState(existing?.outcome || null)

  const [saving, setSaving] = useState(false)

  const isScoreValid = g1 !== '' && g2 !== '' && !isNaN(Number(g1)) && !isNaN(Number(g2)) && Number(g1) >= 0 && Number(g2) >= 0
  const isOutcomeValid = outcome !== null
  const isValid = predType === 'score' ? isScoreValid : isOutcomeValid

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    if (predType === 'score') {
      await onSave({ predictionType: 'score', team1Goals: Number(g1), team2Goals: Number(g2) })
    } else {
      await onSave({ predictionType: 'outcome', outcome })
    }
    setSaving(false)
    onClose()
  }

  const getOutcomeLabel = () => {
    if (predType === 'outcome') {
      if (outcome === 'team1') return `Gana ${match.team1}`
      if (outcome === 'team2') return `Gana ${match.team2}`
      if (outcome === 'draw') return 'Empate'
      return null
    }
    if (g1 === '' || g2 === '') return null
    const n1 = Number(g1), n2 = Number(g2)
    if (n1 > n2) return `Gana ${match.team1}`
    if (n2 > n1) return `Gana ${match.team2}`
    return 'Empate'
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl border border-wc-green max-w-sm w-full p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-wc-gold font-black text-xl text-center mb-1">🔮 Tu Predicción</h2>
        <p className="text-gray-400 text-xs text-center mb-4">
          {match.group ? `Grupo ${match.group}` : ''} · Puedes cambiarla hasta 5 min antes del partido
        </p>

        {/* Prediction type toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-5">
          <button
            onClick={() => setPredType('score')}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
              predType === 'score' ? 'bg-wc-gold text-wc-dark' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎯 Marcador exacto
          </button>
          <button
            onClick={() => setPredType('outcome')}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
              predType === 'outcome' ? 'bg-wc-gold text-wc-dark' : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Solo resultado
          </button>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">{FLAGS[match.team1] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm">{match.team1}</div>
            {predType === 'score' && (
              <input
                type="number"
                min="0"
                max="20"
                inputMode="numeric"
                value={g1}
                onChange={e => setG1(e.target.value)}
                className="mt-2 w-full text-center text-2xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                placeholder="0"
              />
            )}
          </div>

          <div className="text-gray-500 font-bold text-2xl pb-2">
            {predType === 'score' ? '-' : 'VS'}
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">{FLAGS[match.team2] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm">{match.team2}</div>
            {predType === 'score' && (
              <input
                type="number"
                min="0"
                max="20"
                inputMode="numeric"
                value={g2}
                onChange={e => setG2(e.target.value)}
                className="mt-2 w-full text-center text-2xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                placeholder="0"
              />
            )}
          </div>
        </div>

        {/* Outcome buttons (for outcome prediction type) */}
        {predType === 'outcome' && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setOutcome('team1')}
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${
                outcome === 'team1' ? 'bg-wc-green text-white ring-2 ring-wc-green' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Gana<br/>{match.team1}
            </button>
            <button
              onClick={() => setOutcome('draw')}
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${
                outcome === 'draw' ? 'bg-wc-gold text-wc-dark ring-2 ring-wc-gold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Empate
            </button>
            <button
              onClick={() => setOutcome('team2')}
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${
                outcome === 'team2' ? 'bg-wc-green text-white ring-2 ring-wc-green' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Gana<br/>{match.team2}
            </button>
          </div>
        )}

        {/* Outcome preview */}
        {getOutcomeLabel() && (
          <div className="text-center text-wc-gold text-sm font-semibold mb-4">
            Predices: {getOutcomeLabel()}
          </div>
        )}

        {/* Scoring info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-xs text-gray-400 space-y-1">
          {predType === 'score' ? (
            <>
              <div className="flex justify-between"><span>🎯 Aciertas el marcador exacto</span><span className="text-green-400 font-bold">+3 pts</span></div>
              <div className="flex justify-between"><span>✅ Aciertas gana/pierde/empata</span><span className="text-wc-gold font-bold">+1 pt</span></div>
            </>
          ) : (
            <div className="flex justify-between"><span>✅ Aciertas gana/pierde/empata</span><span className="text-wc-gold font-bold">+1 pt</span></div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="flex-1 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

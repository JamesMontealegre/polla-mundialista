import { useState } from 'react'
import { FLAGS } from '../data/matches'

export default function PredictionModal({ match, existing, onSave, onClose }) {
  const [g1, setG1] = useState(existing?.team1Goals ?? '')
  const [g2, setG2] = useState(existing?.team2Goals ?? '')
  const [saving, setSaving] = useState(false)

  const isValid = g1 !== '' && g2 !== '' && Number(g1) >= 0 && Number(g2) >= 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    await onSave({ team1Goals: Number(g1), team2Goals: Number(g2) })
    setSaving(false)
    onClose()
  }

  const getOutcomeLabel = () => {
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
        <p className="text-gray-400 text-xs text-center mb-5">
          {match.group ? `Grupo ${match.group}` : ''} · Puedes cambiarla hasta el pitazo inicial
        </p>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">{FLAGS[match.team1] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm">{match.team1}</div>
            <input
              type="number"
              min="0"
              max="20"
              value={g1}
              onChange={e => setG1(e.target.value)}
              className="mt-2 w-full text-center text-2xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
              placeholder="0"
            />
          </div>

          <div className="text-gray-500 font-bold text-2xl pb-2">-</div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">{FLAGS[match.team2] || '🏳️'}</div>
            <div className="text-white font-semibold text-sm">{match.team2}</div>
            <input
              type="number"
              min="0"
              max="20"
              value={g2}
              onChange={e => setG2(e.target.value)}
              className="mt-2 w-full text-center text-2xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        {/* Outcome preview */}
        {getOutcomeLabel() && (
          <div className="text-center text-wc-gold text-sm font-semibold mb-4">
            Predices: {getOutcomeLabel()}
          </div>
        )}

        {/* Scoring info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-xs text-gray-400 space-y-1">
          <div className="flex justify-between"><span>✅ Aciertas el ganador (o empate)</span><span className="text-wc-gold font-bold">+0.5 pts</span></div>
          <div className="flex justify-between"><span>🎯 Aciertas el marcador exacto</span><span className="text-wc-gold font-bold">+0.5 pts</span></div>
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

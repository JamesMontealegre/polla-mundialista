import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MATCHES, STAGE_NAMES, FLAGS, hasMatchStarted } from '../data/matches'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const { handlePermissionError } = useAuth()
  const [matchResults, setMatchResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingMatch, setEditingMatch] = useState(null)
  const [g1, setG1] = useState('')
  const [g2, setG2] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStage, setFilterStage] = useState('group')
  const [filterGroup, setFilterGroup] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'matches'))
      const results = {}
      snap.docs.forEach(d => { results[d.id] = d.data() })
      setMatchResults(results)
    } catch (err) {
      console.error(err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
        return
      }
    }
    setLoading(false)
  }

  function startEdit(match) {
    const existing = matchResults[match.id]
    setEditingMatch(match)
    setG1(existing?.team1Goals?.toString() ?? '')
    setG2(existing?.team2Goals?.toString() ?? '')
  }

  async function saveResult() {
    if (!editingMatch || g1 === '' || g2 === '') return
    setSaving(true)

    const team1Goals = Number(g1)
    const team2Goals = Number(g2)

    await setDoc(doc(db, 'matches', editingMatch.id), {
      matchId: editingMatch.id,
      team1: editingMatch.team1,
      team2: editingMatch.team2,
      team1Goals,
      team2Goals,
      isFinished: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    setMatchResults(prev => ({
      ...prev,
      [editingMatch.id]: {
        ...prev[editingMatch.id],
        team1Goals, team2Goals, isFinished: true,
      }
    }))

    setSaving(false)
    setEditingMatch(null)
    setSuccessMsg(`✅ Resultado guardado: ${editingMatch.team1} ${team1Goals}-${team2Goals} ${editingMatch.team2}`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  async function clearResult(matchId) {
    if (!confirm('¿Borrar el resultado de este partido?')) return
    await setDoc(doc(db, 'matches', matchId), {
      team1Goals: null,
      team2Goals: null,
      isFinished: false,
    }, { merge: true })
    setMatchResults(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], team1Goals: null, team2Goals: null, isFinished: false }
    }))
  }

  // Update team names for knockout stage
  async function updateKnockoutTeam(matchId, field, value) {
    const match = MATCHES.find(m => m.id === matchId)
    if (!match) return
    const updates = {}
    updates[field] = value
    await setDoc(doc(db, 'matches', matchId), updates, { merge: true })
    setMatchResults(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], ...updates }
    }))
  }

  const filteredMatches = MATCHES.filter(m => {
    if (m.stage !== filterStage) return false
    if (filterStage === 'group' && filterGroup !== 'all' && m.group !== filterGroup) return false
    if (searchText && !m.team1.toLowerCase().includes(searchText.toLowerCase()) && !m.team2.toLowerCase().includes(searchText.toLowerCase())) return false
    return true
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  const stages = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']

  return (
    <div className="min-h-screen bg-wc-dark">
      {/* Header */}
      <div className="bg-gray-900 border-b border-yellow-700 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-wc-gold font-black text-xl">⚙️ Panel de Administrador</h1>
            <p className="text-gray-400 text-xs mt-0.5">Actualiza resultados del Mundial 2026</p>
          </div>
          <button onClick={() => navigate('/')} className="text-gray-400 text-sm hover:text-white">← Inicio</button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-900 border border-green-600 text-green-300 text-sm px-4 py-3 text-center">
          {successMsg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Stage tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stages.map(s => (
            <button
              key={s}
              onClick={() => { setFilterStage(s); setFilterGroup('all') }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterStage === s ? 'bg-wc-gold text-wc-dark' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {STAGE_NAMES[s]}
            </button>
          ))}
        </div>

        {/* Group filter (only for group stage) */}
        {filterStage === 'group' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterGroup('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                filterGroup === 'all' ? 'bg-wc-green text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Todos
            </button>
            {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
              <button
                key={g}
                onClick={() => setFilterGroup(g)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  filterGroup === g ? 'bg-wc-green text-white' : 'bg-gray-800 text-gray-300'
                }`}
              >
                Grupo {g}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-3 text-center">
            <div className="text-2xl font-black text-white">
              {filteredMatches.filter(m => matchResults[m.id]?.isFinished).length}
            </div>
            <div className="text-xs text-gray-400">Finalizados</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-3 text-center">
            <div className="text-2xl font-black text-wc-gold">
              {filteredMatches.filter(m => !matchResults[m.id]?.isFinished && hasMatchStarted(m)).length}
            </div>
            <div className="text-xs text-gray-400">Pendientes</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-3 text-center">
            <div className="text-2xl font-black text-wc-green">
              {filteredMatches.filter(m => !hasMatchStarted(m)).length}
            </div>
            <div className="text-xs text-gray-400">Por jugar</div>
          </div>
        </div>

        {/* Matches list */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">Cargando...</div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map(match => {
              const result = matchResults[match.id]
              const hasResult = result?.isFinished
              const started = hasMatchStarted(match)

              return (
                <div
                  key={match.id}
                  className={`bg-gray-900 rounded-xl border p-4 ${
                    hasResult ? 'border-wc-green' : started ? 'border-yellow-700' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">
                        {match.group ? `Grupo ${match.group} · J${match.matchday}` : STAGE_NAMES[match.stage]} ·
                        {' '}{formatDate(match.date)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{FLAGS[match.team1] || '🏳️'}</span>
                        <span className="text-white font-semibold truncate max-w-[90px]">{match.team1}</span>
                        {hasResult ? (
                          <span className="text-wc-gold font-black text-base">
                            {result.team1Goals} - {result.team2Goals}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-bold">vs</span>
                        )}
                        <span className="text-white font-semibold truncate max-w-[90px]">{match.team2}</span>
                        <span className="text-lg">{FLAGS[match.team2] || '🏳️'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {hasResult && (
                        <button
                          onClick={() => clearResult(match.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-800 hover:border-red-700"
                        >
                          Borrar
                        </button>
                      )}
                      {started && (
                        <button
                          onClick={() => startEdit(match)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            hasResult
                              ? 'bg-gray-700 text-wc-gold hover:bg-gray-600'
                              : 'bg-wc-gold text-wc-dark hover:bg-yellow-400'
                          }`}
                        >
                          {hasResult ? '✏️ Editar' : '📝 Resultado'}
                        </button>
                      )}
                      {!started && (
                        <span className="text-xs text-gray-500 italic">Aún no empieza</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setEditingMatch(null)}>
          <div
            className="bg-gray-900 rounded-2xl border border-wc-gold max-w-sm w-full p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-wc-gold font-black text-lg text-center mb-4">📝 Ingresar Resultado</h2>

            <div className="text-center text-xs text-gray-400 mb-4">
              {editingMatch.group ? `Grupo ${editingMatch.group} · ` : ''}{formatDate(editingMatch.date)}
            </div>

            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex-1 text-center">
                <div className="text-2xl mb-1">{FLAGS[editingMatch.team1] || '🏳️'}</div>
                <div className="text-white text-sm font-semibold mb-2">{editingMatch.team1}</div>
                <input
                  type="number" min="0" max="20" value={g1}
                  onChange={e => setG1(e.target.value)}
                  className="w-full text-center text-2xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                  placeholder="0" autoFocus
                />
              </div>
              <div className="text-gray-500 font-bold text-2xl">-</div>
              <div className="flex-1 text-center">
                <div className="text-2xl mb-1">{FLAGS[editingMatch.team2] || '🏳️'}</div>
                <div className="text-white text-sm font-semibold mb-2">{editingMatch.team2}</div>
                <input
                  type="number" min="0" max="20" value={g2}
                  onChange={e => setG2(e.target.value)}
                  className="w-full text-center text-2xl font-black bg-gray-800 text-wc-gold rounded-lg py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={saveResult}
                disabled={g1 === '' || g2 === '' || saving}
                className="flex-1 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50"
              >
                {saving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

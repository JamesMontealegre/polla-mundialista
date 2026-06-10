import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MATCHES, STAGE_NAMES, hasMatchStarted } from '../data/matches'
import { calculatePoints } from '../utils/scoring'
import MatchCard from '../components/MatchCard'
import PredictionModal from '../components/PredictionModal'
import Leaderboard from '../components/Leaderboard'

const STAGES = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']
const STAGE_ORDER = { group: 0, r32: 1, r16: 2, qf: 3, sf: 4, '3rd': 5, final: 6 }

export default function GroupPage() {
  const { groupId } = useParams()
  const { user, isAdmin, handlePermissionError } = useAuth()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [matchResults, setMatchResults] = useState({}) // matchId → { team1Goals, team2Goals, isFinished }
  const [predictions, setPredictions] = useState({}) // matchId → prediction
  const [scores, setScores] = useState([]) // [{uid, displayName, totalPoints, ...}]
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [activeTab, setActiveTab] = useState('matches')
  const [activeStage, setActiveStage] = useState('group')
  const [activeGroup, setActiveGroup] = useState('all')
  const [inviteCopied, setInviteCopied] = useState(false)

  useEffect(() => {
    loadAll()
  }, [groupId, user])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([
        loadGroup(),
        loadMembers(),
        loadMatchResults(),
        loadMyPredictions(),
      ])
    } catch (err) {
      console.error(err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
        return
      }
    }
    setLoading(false)
  }

  async function loadGroup() {
    const snap = await getDoc(doc(db, 'groups', groupId))
    if (snap.exists()) setGroup({ id: snap.id, ...snap.data() })
  }

  async function loadMembers() {
    const q = query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
    const snap = await getDocs(q)
    setMembers(snap.docs.map(d => ({ docId: d.id, ...d.data() })))
  }

  async function removeMember(member) {
    if (!confirm(`¿Eliminar a ${member.displayName} del grupo?`)) return
    try {
      await deleteDoc(doc(db, 'groupMembers', member.docId))
      setMembers(prev => prev.filter(m => m.uid !== member.uid))
    } catch (err) {
      console.error('Error eliminando miembro:', err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
      }
    }
  }

  async function loadMatchResults() {
    const snap = await getDocs(collection(db, 'matches'))
    const results = {}
    snap.docs.forEach(d => { results[d.id] = d.data() })
    setMatchResults(results)
  }

  async function loadMyPredictions() {
    const q = query(
      collection(db, 'predictions'),
      where('groupId', '==', groupId),
      where('uid', '==', user.uid)
    )
    const snap = await getDocs(q)
    const preds = {}
    snap.docs.forEach(d => {
      const data = d.data()
      preds[data.matchId] = data
    })
    setPredictions(preds)
  }

  // Calcular scores en tiempo real
  useEffect(() => {
    if (members.length === 0) return
    computeScores()
  }, [members, matchResults, predictions])

  async function computeScores() {
    // Cargar predicciones de todos los miembros
    const allPredictions = {}

    const q = query(collection(db, 'predictions'), where('groupId', '==', groupId))
    const snap = await getDocs(q)
    snap.docs.forEach(d => {
      const data = d.data()
      if (!allPredictions[data.uid]) allPredictions[data.uid] = {}
      allPredictions[data.uid][data.matchId] = data
    })

    // Calcular score por miembro
    const scoresList = members.map(member => {
      const memberPreds = allPredictions[member.uid] || {}
      let totalPoints = 0, correctWinners = 0, correctScores = 0

      Object.entries(memberPreds).forEach(([matchId, pred]) => {
        const result = matchResults[matchId]
        if (!result || !result.isFinished) return
        const { points, correctWinner, correctScore } = calculatePoints(
          pred,
          { team1Goals: result.team1Goals, team2Goals: result.team2Goals }
        )
        totalPoints += points
        if (correctWinner) correctWinners++
        if (correctScore) correctScores++
      })

      return {
        uid: member.uid,
        displayName: member.displayName,
        photoURL: member.photoURL,
        totalPoints,
        correctWinners,
        correctScores,
      }
    })

    setScores(scoresList)
  }

  async function savePrediction(match, predData) {
    const predId = `${groupId}_${match.id}_${user.uid}`
    const predDoc = {
      groupId,
      matchId: match.id,
      uid: user.uid,
      predictionType: predData.predictionType || 'score',
      updatedAt: serverTimestamp(),
    }

    if (predData.predictionType === 'outcome') {
      predDoc.outcome = predData.outcome
      predDoc.team1Goals = null
      predDoc.team2Goals = null
    } else {
      predDoc.team1Goals = predData.team1Goals
      predDoc.team2Goals = predData.team2Goals
      predDoc.outcome = null
    }

    await setDoc(doc(db, 'predictions', predId), predDoc)

    setPredictions(prev => ({
      ...prev,
      [match.id]: { ...predDoc, updatedAt: null }
    }))
  }

  async function deletePrediction(matchId) {
    const predId = `${groupId}_${matchId}_${user.uid}`
    try {
      await deleteDoc(doc(db, 'predictions', predId))
      setPredictions(prev => {
        const next = { ...prev }
        delete next[matchId]
        return next
      })
    } catch (err) {
      console.error('Error eliminando predicción:', err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
      }
    }
  }

  const copyInviteCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.inviteCode)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const copyInviteLink = () => {
    if (!group) return
    navigator.clipboard.writeText(`${window.location.origin}/join?code=${group.inviteCode}`)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  // Filtrar partidos por fase y grupo
  const filteredMatches = useMemo(() => {
    return MATCHES.filter(m => {
      if (activeStage === 'group') {
        if (m.stage !== 'group') return false
        if (activeGroup === 'all') return true
        return m.group === activeGroup
      }
      // Fases eliminatorias: agrupar 3rd con final
      if (activeStage === 'final') {
        return m.stage === 'final' || m.stage === '3rd'
      }
      return m.stage === activeStage
    }).sort((a, b) => {
      const da = new Date(a.date), db2 = new Date(b.date)
      if (da - db2 !== 0) return da - db2
      return (a.matchNum || 0) - (b.matchNum || 0)
    })
  }, [activeStage, activeGroup])

  // Partidos con resultados pendientes (para mostrar primero)
  const upcomingMatches = filteredMatches.filter(m => !hasMatchStarted(m))
  const playedMatches = filteredMatches.filter(m => hasMatchStarted(m))

  if (loading) {
    return (
      <div className="min-h-screen bg-wc-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">⚽</div>
          <p className="text-gray-400">Cargando grupo...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-wc-dark flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p>Grupo no encontrado</p>
          <button onClick={() => navigate('/')} className="text-wc-gold mt-2">← Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wc-dark">
      {/* Group Header */}
      <div className="bg-gradient-to-b from-wc-green/30 to-wc-dark px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate('/')} className="text-gray-400 text-sm mb-3 hover:text-white">
            ← Mis grupos
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">{group.name}</h1>
              <div className="text-gray-400 text-sm mt-1">
                {members.length} participante{members.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={copyInviteCode}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                inviteCopied ? 'bg-green-700 text-white' : 'bg-gray-800 text-wc-gold border border-gray-600 hover:bg-gray-700'
              }`}
            >
              {inviteCopied ? '✅ Copiado' : `🔗 ${group.inviteCode}`}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] z-40 bg-wc-dark border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 flex">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'matches' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            ⚽ Partidos
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'leaderboard' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            🏆 Tabla
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'members' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            👥 Grupo
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {/* Stage filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'group', label: 'Grupos' },
                { key: 'r32', label: '16avos' },
                { key: 'r16', label: '8vos' },
                { key: 'qf', label: '4tos' },
                { key: 'sf', label: 'Semi' },
                { key: 'final', label: 'Final' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => { setActiveStage(s.key); setActiveGroup('all') }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeStage === s.key ? 'bg-wc-gold text-wc-dark' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Group sub-filter (only for group stage) */}
            {activeStage === 'group' && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setActiveGroup('all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeGroup === 'all' ? 'bg-wc-green text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Todos
                </button>
                {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      activeGroup === g ? 'bg-wc-green text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            {/* Upcoming matches */}
            {upcomingMatches.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-wc-gold rounded-full"></span>
                  Próximos partidos ({upcomingMatches.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcomingMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={{ ...match, ...matchResults[match.id] }}
                      prediction={predictions[match.id]}
                      onPredict={setSelectedMatch}
                      onReset={deletePrediction}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Played matches */}
            {playedMatches.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Partidos jugados ({playedMatches.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {playedMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={{ ...match, ...matchResults[match.id] }}
                      prediction={predictions[match.id]}
                      onPredict={null}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">🏆 Tabla de Posiciones</h2>
              <span className="text-gray-400 text-xs">{members.length} participantes</span>
            </div>
            <Leaderboard scores={scores} currentUserId={user.uid} />
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">👥 Participantes</h2>
            </div>
            <div className="space-y-2 mb-6">
              {members.map(m => (
                <div key={m.uid} className="flex items-center gap-3 bg-gray-900 rounded-xl p-3 border border-gray-700">
                  {m.photoURL ? (
                    <img src={m.photoURL} alt={m.displayName} className="w-10 h-10 rounded-full border border-gray-600" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-wc-green flex items-center justify-center text-white font-bold">
                      {m.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">
                      {m.displayName}
                      {m.uid === user.uid && <span className="text-wc-gold text-xs ml-1">(tú)</span>}
                    </div>
                    {group.adminIds?.includes(m.uid) && (
                      <div className="text-wc-green text-xs">⭐ Admin del grupo</div>
                    )}
                  </div>
                  {isAdmin && m.uid !== user.uid && (
                    <button
                      onClick={() => removeMember(m)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-800 hover:border-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Share invite */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-2">🔗 Invitar amigos</h3>
              <p className="text-gray-400 text-xs mb-3">Comparte este enlace o código para que se unan:</p>
              <div className="bg-gray-800 rounded-lg p-3 font-mono text-wc-gold text-sm break-all">
                {window.location.origin}/join?code={group.inviteCode}
              </div>
              <button
                onClick={copyInviteLink}
                className={`w-full mt-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  inviteCopied ? 'bg-green-700 text-white' : 'bg-wc-gold text-wc-dark hover:bg-yellow-400'
                }`}
              >
                {inviteCopied ? '✅ ¡Enlace copiado!' : '📋 Copiar enlace de invitación'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Modal */}
      {selectedMatch && (
        <PredictionModal
          match={selectedMatch}
          existing={predictions[selectedMatch.id]}
          onSave={(pred) => savePrediction(selectedMatch, pred)}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}

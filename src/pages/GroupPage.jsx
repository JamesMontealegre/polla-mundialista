import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, updateDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MATCHES, STAGE_NAMES, hasMatchStarted, getActiveDateMatches } from '../data/matches'
import { calculatePoints } from '../utils/scoring'
import MatchCard from '../components/MatchCard'
import PredictionModal from '../components/PredictionModal'
import Leaderboard from '../components/Leaderboard'
import PaymentModal from '../components/PaymentModal'
import GameRules from '../components/GameRules'
import StatsTable from '../components/StatsTable'
import MemberMatchBadges from '../components/MemberMatchBadges'
import { HIDDEN_EMAILS } from '../config/hiddenUsers'

const STAGES = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']
const STAGE_ORDER = { group: 0, r32: 1, r16: 2, qf: 3, sf: 4, '3rd': 5, final: 6 }

export default function GroupPage() {
  const { groupId } = useParams()
  const { user, isAdmin, handlePermissionError } = useAuth()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [matchResults, setMatchResults] = useState({}) // matchId → { team1Goals, team2Goals, isFinished }
  const [predictions, setPredictions] = useState({}) // matchId → prediction (mis predicciones)
  const [allPredictions, setAllPredictions] = useState({}) // uid → { matchId → prediction }
  const [scores, setScores] = useState([]) // [{uid, displayName, totalPoints, ...}]
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [activeTab, setActiveTab] = useState('matches')
  const [activeStage, setActiveStage] = useState('group')
  const [activeGroup, setActiveGroup] = useState('all')
  const [inviteCopied, setInviteCopied] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

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
        loadAllPredictions(),
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
    const membersList = snap.docs.map(d => ({ docId: d.id, ...d.data() }))

    // Fetch phone numbers from users collection
    const userDocs = await Promise.all(
      membersList.map(m => getDoc(doc(db, 'users', m.uid)))
    )
    userDocs.forEach((uDoc, i) => {
      if (uDoc.exists()) {
        const uData = uDoc.data()
        membersList[i].phoneNumber = uData.phoneNumber || null
        membersList[i].email = uData.email || null
      }
    })

    setMembers(membersList)
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

  async function updatePaymentStatus(member, newStatus) {
    try {
      await updateDoc(doc(db, 'groupMembers', member.docId), {
        paymentStatus: newStatus,
        paymentReviewedAt: new Date().toISOString(),
        paymentReviewedBy: user.uid,
      })
      setMembers(prev => prev.map(m =>
        m.docId === member.docId ? { ...m, paymentStatus: newStatus } : m
      ))
    } catch (err) {
      console.error('Error actualizando pago:', err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
      }
    }
  }

  async function loadMatchResults() {
    // Cache en sessionStorage (5 min TTL)
    const cacheKey = 'matchResults'
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < 5 * 60_000) {
          setMatchResults(data)
          return
        }
      } catch { /* cache corrupto, recargar */ }
    }
    const snap = await getDocs(collection(db, 'matches'))
    const results = {}
    snap.docs.forEach(d => { results[d.id] = d.data() })
    setMatchResults(results)
    sessionStorage.setItem(cacheKey, JSON.stringify({ data: results, ts: Date.now() }))
  }

  async function loadAllPredictions() {
    // Carga TODAS las predicciones del grupo una sola vez
    const q = query(collection(db, 'predictions'), where('groupId', '==', groupId))
    const snap = await getDocs(q)
    const all = {}
    const mine = {}
    snap.docs.forEach(d => {
      const data = d.data()
      if (!all[data.uid]) all[data.uid] = {}
      all[data.uid][data.matchId] = data
      if (data.uid === user.uid) mine[data.matchId] = data
    })
    setAllPredictions(all)
    setPredictions(mine)
  }

  // Recalcular scores cuando cambian los datos en memoria (sin Firestore)
  useEffect(() => {
    if (members.length === 0 || Object.keys(matchResults).length === 0) return
    computeScores()
  }, [members, matchResults, allPredictions])

  function computeScores() {
    // UIDs ocultos (admins + perfiles de prueba)
    const hiddenUids = new Set(
      members.filter(m => isHiddenMember(m)).map(m => m.uid)
    )

    // Partidos finalizados
    const finishedMatchIds = MATCHES
      .filter(m => matchResults[m.id]?.isFinished)
      .map(m => m.id)

    // Anticipación: por cada partido, el primer predictor correcto gana +1
    const anticipationWinners = {}
    for (const matchId of finishedMatchIds) {
      const result = matchResults[matchId]
      const correctPreds = []
      for (const [uid, preds] of Object.entries(allPredictions)) {
        if (hiddenUids.has(uid)) continue
        const pred = preds[matchId]
        if (!pred) continue
        const { correctWinner } = calculatePoints(pred, {
          team1Goals: result.team1Goals,
          team2Goals: result.team2Goals,
        })
        if (correctWinner && pred.updatedAt) {
          const millis = pred.updatedAt.toDate
            ? pred.updatedAt.toDate().getTime()
            : pred.updatedAt.seconds ? pred.updatedAt.seconds * 1000 : Infinity
          correctPreds.push({ uid, millis })
        }
      }
      if (correctPreds.length > 0) {
        correctPreds.sort((a, b) => a.millis - b.millis)
        anticipationWinners[matchId] = correctPreds[0].uid
      }
    }

    // Calcular score por miembro (excluir admins y perfiles de prueba)
    const scoresList = members.filter(m => !hiddenUids.has(m.uid)).map(member => {
      const memberPreds = allPredictions[member.uid] || {}
      let totalPoints = 0, correctWinners = 0, correctScores = 0
      let timestampSum = 0, timestampCount = 0

      Object.entries(memberPreds).forEach(([matchId, pred]) => {
        const ts = pred.updatedAt
        if (ts) {
          const millis = ts.toDate ? ts.toDate().getTime() : ts.seconds ? ts.seconds * 1000 : null
          if (millis) {
            timestampSum += millis
            timestampCount++
          }
        }

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

      const avgTimestamp = timestampCount > 0 ? timestampSum / timestampCount : Infinity

      const predictedFinished = finishedMatchIds.filter(mid => memberPreds[mid]).length
      const noParticipation = finishedMatchIds.length - predictedFinished

      const anticipation = Object.values(anticipationWinners).filter(uid => uid === member.uid).length

      return {
        uid: member.uid,
        displayName: member.displayName,
        photoURL: member.photoURL,
        paymentStatus: member.paymentStatus || 'pending',
        totalPoints,
        correctWinners,
        correctScores,
        avgTimestamp,
        noParticipation,
        anticipation,
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

    // Actualizar localmente (sin re-query a Firestore)
    const localPred = { ...predDoc, updatedAt: { seconds: Math.floor(Date.now() / 1000) } }
    setPredictions(prev => ({ ...prev, [match.id]: localPred }))
    setAllPredictions(prev => ({
      ...prev,
      [user.uid]: { ...(prev[user.uid] || {}), [match.id]: localPred }
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
      setAllPredictions(prev => {
        const userPreds = { ...(prev[user.uid] || {}) }
        delete userPreds[matchId]
        return { ...prev, [user.uid]: userPreds }
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

  // Membership y estado de pago del usuario actual
  const myMembership = members.find(m => m.uid === user.uid)
  const myPaymentStatus = myMembership?.paymentStatus || 'pending'
  const isGroupAdmin = group?.adminIds?.includes(user.uid)
  const isGroupPaid = group?.isPaid !== false
  const isPaymentConfirmed = !isGroupPaid || myPaymentStatus === 'confirmed' || isGroupAdmin

  // Helper: miembro oculto (admin del grupo o perfil de prueba)
  const isHiddenMember = (m) => {
    const adminIds = group?.adminIds || []
    return adminIds.includes(m.uid) || HIDDEN_EMAILS.has(m.email)
  }

  // Participantes visibles (excluye admins y perfiles de prueba)
  const visibleMembers = useMemo(() => members.filter(m => !isHiddenMember(m)), [members, group])

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

  const finishedMatchCount = useMemo(() =>
    MATCHES.filter(m => matchResults[m.id]?.isFinished).length,
    [matchResults]
  )

  const { matches: activeDateMatches, fechaNumber } = useMemo(() => getActiveDateMatches(), [])

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
                {visibleMembers.length} participante{visibleMembers.length !== 1 ? 's' : ''}
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
        <div className="max-w-2xl mx-auto px-4 flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'matches' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            ⚽ Partidos
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'leaderboard' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            🏆 Tabla
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'stats' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📊 Asi vamos
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'members' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            👥 Grupo
          </button>
          {isGroupPaid && isAdmin && (
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'payments' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              💰 Pagos
            </button>
          )}
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'rules' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📋 Reglas
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Payment banner (hide for group admin and free groups) */}
        {isGroupPaid && !isPaymentConfirmed && myMembership && !isGroupAdmin && (
          <div className={`rounded-xl p-4 mb-4 border ${
            myPaymentStatus === 'uploaded'
              ? 'bg-blue-900/20 border-blue-700'
              : myPaymentStatus === 'rejected'
              ? 'bg-red-900/20 border-red-700'
              : 'bg-yellow-900/20 border-yellow-700'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`font-bold text-sm ${
                  myPaymentStatus === 'uploaded' ? 'text-blue-300' :
                  myPaymentStatus === 'rejected' ? 'text-red-300' : 'text-yellow-300'
                }`}>
                  {myPaymentStatus === 'uploaded'
                    ? 'Comprobante en revision'
                    : myPaymentStatus === 'rejected'
                    ? 'Comprobante rechazado'
                    : 'Pago pendiente'}
                </div>
                <p className="text-gray-400 text-xs mt-0.5">
                  {myPaymentStatus === 'uploaded'
                    ? 'El admin esta revisando tu comprobante.'
                    : myPaymentStatus === 'rejected'
                    ? 'Tu comprobante fue rechazado. Sube uno nuevo.'
                    : 'Debes pagar para poder hacer predicciones.'}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex-shrink-0 px-4 py-2 rounded-lg bg-wc-gold text-wc-dark font-bold text-xs"
              >
                {myPaymentStatus === 'rejected' ? 'Resubir' : myPaymentStatus === 'uploaded' ? 'Ver estado' : 'Pagar'}
              </button>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {/* Stage filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'group', label: 'Grupos' },
                { key: 'r32', label: '16vos' },
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
                      onPredict={isPaymentConfirmed ? setSelectedMatch : null}
                      onReset={isPaymentConfirmed ? deletePrediction : null}
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
              <span className="text-gray-400 text-xs">{visibleMembers.length} participantes</span>
            </div>
            <Leaderboard
              scores={scores}
              currentUserId={user.uid}
              confirmedMemberCount={visibleMembers.filter(m => (m.paymentStatus || 'pending') === 'confirmed').length}
              totalMemberCount={visibleMembers.length}
              isPaid={isGroupPaid}
            />
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">📊 Asi vamos</h2>
              <span className="text-gray-400 text-xs">{finishedMatchCount} partidos jugados</span>
            </div>
            <StatsTable scores={scores} currentUserId={user.uid} />
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">👥 Participantes</h2>
            </div>
            {activeDateMatches.length > 0 && (
              <div className="text-gray-400 text-xs font-semibold mb-2">
                Resultados - Fecha {fechaNumber}
              </div>
            )}
            <div className="space-y-2 mb-6">
              {[...visibleMembers].sort((a, b) => {
                const order = { confirmed: 0, uploaded: 1, pending: 2, rejected: 3 }
                return (order[a.paymentStatus] ?? 2) - (order[b.paymentStatus] ?? 2)
              }).map(m => (
                <div key={m.uid} className="bg-gray-900 rounded-xl p-3 border border-gray-700">
                  <div className="flex items-center gap-3">
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
                        {m.uid === user.uid && <span className="text-wc-gold text-xs ml-1">(tu)</span>}
                      </div>
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
                  {activeDateMatches.length > 0 && (
                    <MemberMatchBadges
                      matches={activeDateMatches}
                      memberPredictions={allPredictions[m.uid] || {}}
                      matchResults={matchResults}
                    />
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

        {/* RULES TAB */}
        {activeTab === 'rules' && (
          <div>
            <GameRules isPaid={isGroupPaid} />
          </div>
        )}

        {/* PAYMENTS TAB (admin only, paid groups only) */}
        {activeTab === 'payments' && isGroupPaid && isAdmin && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">💰 Gestion de Pagos</h2>
              <span className="text-gray-400 text-xs">
                {visibleMembers.filter(m => (m.paymentStatus || 'pending') === 'confirmed').length}/{visibleMembers.length} habilitados
              </span>
            </div>
            <div className="space-y-2">
              {[...visibleMembers].sort((a, b) => {
                const order = { uploaded: 0, pending: 1, rejected: 2, confirmed: 3 }
                return (order[a.paymentStatus] ?? 1) - (order[b.paymentStatus] ?? 1)
              }).map(m => {
                const pStatus = m.paymentStatus || 'pending'
                const statusConfig = {
                  pending: { label: 'Pendiente', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700' },
                  uploaded: { label: 'Enviado', color: 'text-blue-400 bg-blue-900/30 border-blue-700' },
                  confirmed: { label: 'Habilitado', color: 'text-green-400 bg-green-900/30 border-green-700' },
                  rejected: { label: 'Rechazado', color: 'text-red-400 bg-red-900/30 border-red-700' },
                }
                const cfg = statusConfig[pStatus] || statusConfig.pending

                return (
                  <div key={m.uid} className={`bg-gray-900 rounded-xl border ${pStatus === 'uploaded' ? 'border-blue-700' : 'border-gray-700'} overflow-hidden`}>
                    {/* Header: user info + status */}
                    <div className="flex items-center gap-3 p-3">
                      {m.photoURL ? (
                        <img src={m.photoURL} alt={m.displayName} className="w-10 h-10 rounded-full border border-gray-600" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-wc-green flex items-center justify-center text-white font-bold">
                          {m.displayName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">
                          {m.displayName}
                          {m.phoneNumber
                            ? <span className="text-gray-400 font-normal"> - {m.phoneNumber}</span>
                            : <span className="text-gray-500 font-normal italic"> - celular no inscrito</span>
                          }
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Transaction details */}
                    {m.receiptData ? (
                      <div className="px-3 pb-3">
                        <div className="bg-gray-800 rounded-lg p-3 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">Monto verificado</span>
                            <span className="text-white font-bold text-sm">
                              ${m.receiptData.amount?.toLocaleString('es-CO')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">Destino</span>
                            <span className="text-white text-xs">
                              {m.receiptData.destType === 'nequi' ? 'Nequi detectado' : m.receiptData.destType === 'nombre' ? 'Nombre detectado' : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">Fecha envio</span>
                            <span className="text-white text-xs">
                              {m.receiptData.submittedAt
                                ? new Date(m.receiptData.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons for uploaded receipts */}
                        {pStatus === 'uploaded' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => updatePaymentStatus(m, 'confirmed')}
                              className="flex-1 text-xs py-2 rounded-lg bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800 font-bold transition-colors"
                            >
                              Confirmar pago
                            </button>
                            <button
                              onClick={() => updatePaymentStatus(m, 'rejected')}
                              className="flex-1 text-xs py-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900 border border-red-800 font-bold transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                        {pStatus === 'rejected' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => updatePaymentStatus(m, 'confirmed')}
                              className="flex-1 text-xs py-2 rounded-lg bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800 font-bold transition-colors"
                            >
                              Confirmar pago
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-3 pb-3">
                        <div className="text-gray-500 text-xs italic">No ha enviado comprobante</div>
                        {pStatus !== 'confirmed' && (
                          <button
                            onClick={() => updatePaymentStatus(m, 'confirmed')}
                            className="mt-2 text-xs py-1.5 px-3 rounded-lg bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800 font-bold transition-colors"
                          >
                            Confirmar manualmente
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
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

      {/* Payment Modal */}
      {isGroupPaid && showPaymentModal && myMembership && (
        <PaymentModal
          groupId={groupId}
          memberDocId={myMembership.docId}
          currentStatus={myPaymentStatus}
          onUploadComplete={() => {
            setShowPaymentModal(false)
            loadMembers()
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

    </div>
  )
}

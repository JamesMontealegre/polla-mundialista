import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, query, where, getDocs, setDoc, addDoc, deleteDoc, updateDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MATCHES, STAGE_NAMES, FLAGS, ALL_TEAMS, hasMatchStarted, getActiveDateMatches } from '../data/matches'
import { calculatePoints } from '../utils/scoring'
import MatchCard from '../components/MatchCard'
import PredictionModal from '../components/PredictionModal'
import Leaderboard from '../components/Leaderboard'
import PaymentModal from '../components/PaymentModal'
import GameRules from '../components/GameRules'
import StatsTable from '../components/StatsTable'
import MemberMatchBadges from '../components/MemberMatchBadges'
import FinalPredictionCard from '../components/FinalPredictionCard'
import CountdownBanner from '../components/CountdownBanner'
import TopScorerPredictionCard from '../components/TopScorerPredictionCard'
import { HIDDEN_EMAILS } from '../config/hiddenUsers'

const STAGES = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']
const STAGE_ORDER = { group: 0, r32: 1, r16: 2, qf: 3, sf: 4, '3rd': 5, final: 6 }

// Deadline: 28 jun 2026 00:00 Colombia (UTC-5) = 28 jun 05:00 UTC
const FINAL_PRED_DEADLINE = new Date('2026-06-28T05:00:00Z')
const THIRD_PLACE_PRED_DEADLINE = FINAL_PRED_DEADLINE

function AdminPaymentAmountEditor({ amount, onSave, label = 'Monto de inscripción' }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(amount)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const num = parseInt(value, 10)
    if (!num || num < 1000) return
    setSaving(true)
    await onSave(num)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">{label}</span>
        {!editing ? (
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">${amount.toLocaleString('es-CO')} COP</span>
            <button onClick={() => { setValue(amount); setEditing(true) }} className="text-xs text-wc-gold hover:text-yellow-300">Editar</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-28 bg-gray-800 text-white text-sm rounded-lg px-2 py-1 border border-gray-600 focus:border-wc-gold focus:outline-none"
            />
            <button onClick={handleSave} disabled={saving} className="text-xs bg-wc-gold text-wc-dark font-bold px-3 py-1 rounded-lg disabled:opacity-50">
              {saving ? '...' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-white">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminTopScorerResult({ current, onSave }) {
  const [team, setTeam] = useState(current?.team || '')
  const [jersey, setJersey] = useState(current?.jerseyNumber || '')
  const [goals, setGoals] = useState(current?.goals || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!team || !jersey || !goals || saving) return
    setSaving(true)
    await onSave(team, jersey, goals)
    setSaving(false)
  }

  return (
    <div className="mt-3 bg-gray-900 border border-dashed border-gray-600 rounded-xl p-4">
      <div className="text-gray-400 text-xs font-semibold mb-2">Admin · Registrar resultado del goleador</div>
      <div className="space-y-2">
        <select value={team} onChange={e => setTeam(e.target.value)} className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none">
          <option value="">Seleccionar seleccionado...</option>
          {ALL_TEAMS.map(t => <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>)}
        </select>
        <div className="flex gap-2">
          <select value={jersey} onChange={e => setJersey(e.target.value)} className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none">
            <option value="">Camiseta...</option>
            {Array.from({ length: 99 }, (_, i) => i + 1).map(n => <option key={n} value={n}>#{n}</option>)}
          </select>
          <select value={goals} onChange={e => setGoals(e.target.value)} className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none">
            <option value="">Goles...</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} gol{n > 1 ? 'es' : ''}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={!team || !jersey || !goals || saving} className="w-full py-2 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50 hover:bg-yellow-400 transition-colors">
          {saving ? 'Guardando...' : current ? 'Actualizar resultado' : 'Guardar resultado'}
        </button>
      </div>
      {current && (
        <p className="text-gray-500 text-xs mt-2 text-center">
          Resultado actual: {FLAGS[current.team]} {current.team} · #{current.jerseyNumber} · {current.goals} goles
        </p>
      )}
    </div>
  )
}

export default function GroupPage() {
  const { groupId } = useParams()
  const { user, isAdmin, handlePermissionError } = useAuth()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [matchResults, setMatchResults] = useState({}) // matchId → { team1Goals, team2Goals, isFinished }
  const [predictions, setPredictions] = useState({}) // matchId → prediction (mis predicciones)
  const [allPredictions, setAllPredictions] = useState({}) // uid → { matchId → prediction }
  const [finalPredictions, setFinalPredictions] = useState({}) // uid → { finalTeam1, finalTeam2, updatedAt }
  const [thirdPlacePredictions, setThirdPlacePredictions] = useState({}) // uid → { finalTeam1, finalTeam2, winner, updatedAt }
  const [topScorerPredictions, setTopScorerPredictions] = useState({}) // uid → { team, jerseyNumber, goals }
  const [scores, setScores] = useState([]) // [{uid, displayName, totalPoints, ...}]
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [activeTab, setActiveTab] = useState('matches')
  const [activeStage, setActiveStage] = useState(() => {
    const order = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']
    for (const stage of order) {
      const stageMatches = MATCHES.filter(m => m.stage === stage)
      if (stageMatches.length > 0 && stageMatches.some(m => !hasMatchStarted(m))) return stage
    }
    return 'final'
  })
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

  async function loadMatchResults(skipCache = false) {
    // Cache en sessionStorage (5 min TTL)
    const cacheKey = 'matchResults'
    if (!skipCache) {
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
    const finals = {}
    const thirds = {}
    const topScorers = {}
    snap.docs.forEach(d => {
      const data = d.data()
      if (data.matchId === 'FINALISTS') {
        finals[data.uid] = data
        return
      }
      if (data.matchId === 'THIRD_PLACE') {
        thirds[data.uid] = data
        return
      }
      if (data.matchId === 'TOP_SCORER') {
        topScorers[data.uid] = data
        return
      }
      if (!all[data.uid]) all[data.uid] = {}
      all[data.uid][data.matchId] = data
      if (data.uid === user.uid) mine[data.matchId] = data
    })
    setAllPredictions(all)
    setPredictions(mine)
    setFinalPredictions(finals)
    setThirdPlacePredictions(thirds)
    setTopScorerPredictions(topScorers)
  }

  // Listener en tiempo real: escuchar cambios en resultados cuando hay partidos en curso
  const hasLiveMatches = MATCHES.some(m => matchResults[m.id]?.isLive)
  useEffect(() => {
    if (!hasLiveMatches) return
    const unsub = onSnapshot(collection(db, 'matches'), (snap) => {
      const results = {}
      snap.docs.forEach(d => { results[d.id] = d.data() })
      setMatchResults(results)
      sessionStorage.setItem('matchResults', JSON.stringify({ data: results, ts: Date.now() }))
    })
    return () => unsub()
  }, [hasLiveMatches])

  // Recalcular scores cuando cambian los datos en memoria (sin Firestore)
  useEffect(() => {
    if (members.length === 0 || Object.keys(matchResults).length === 0) return
    computeScores()
  }, [members, matchResults, allPredictions, finalPredictions, thirdPlacePredictions, topScorerPredictions, group])

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

    // Mapa de cutoff por partido (5 min antes del inicio)
    const matchCutoffs = {}
    MATCHES.forEach(m => {
      matchCutoffs[m.id] = new Date(m.date).getTime() - 5 * 60 * 1000
    })

    // Calcular score por miembro (excluir admins y perfiles de prueba)
    const scoresList = members.filter(m => !hiddenUids.has(m.uid)).map(member => {
      const memberPreds = allPredictions[member.uid] || {}
      let totalPoints = 0, correctWinners = 0, correctScores = 0
      let anticipationHoursSum = 0, anticipationHoursCount = 0

      Object.entries(memberPreds).forEach(([matchId, pred]) => {
        // Anticipación relativa: horas antes del cierre del partido
        const ts = pred.updatedAt
        const cutoff = matchCutoffs[matchId]
        if (ts && cutoff) {
          const millis = ts.toDate ? ts.toDate().getTime() : ts.seconds ? ts.seconds * 1000 : null
          if (millis && millis < cutoff) {
            const hoursBeforeCutoff = (cutoff - millis) / (1000 * 60 * 60)
            anticipationHoursSum += hoursBeforeCutoff
            anticipationHoursCount++
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

      const avgAnticipationHours = anticipationHoursCount > 0
        ? Math.round((anticipationHoursSum / anticipationHoursCount) * 10) / 10
        : 0

      const predictedFinished = finishedMatchIds.filter(mid => memberPreds[mid]).length
      const noParticipation = finishedMatchIds.length - predictedFinished

      const anticipation = Object.values(anticipationWinners).filter(uid => uid === member.uid).length

      // Puntos extra — solo se suman cuando el admin los revela
      let finalistBonus = 0
      const extrasAreRevealed = group?.extrasRevealed === true

      if (extrasAreRevealed) {
        function extraBonus(result, pred) {
          if (!result?.isFinished || !pred) return 0
          const actualTeams = new Set([result.team1, result.team2])
          const predTeams = new Set([pred.finalTeam1, pred.finalTeam2])
          const teamsOk = actualTeams.size === 2 && predTeams.size === 2 && [...predTeams].every(t => actualTeams.has(t))
          const actualWinner = result.team1Goals > result.team2Goals ? result.team1
            : result.team2Goals > result.team1Goals ? result.team2 : null
          const resultOk = Boolean(actualWinner && pred.winner === actualWinner)
          return (teamsOk ? 3 : 0) + (resultOk ? 2 : 0)
        }

        finalistBonus += extraBonus(matchResults['FINAL'], finalPredictions[member.uid])

        const thirdPlaceMatchId = MATCHES.find(m => m.stage === '3rd')?.id
        if (thirdPlaceMatchId) {
          finalistBonus += extraBonus(matchResults[thirdPlaceMatchId], thirdPlacePredictions[member.uid])
        }

        // Goleador: goles=3pts, seleccionado=1pt, camiseta=1pt (max 5)
        const tsResult = group?.topScorerResult
        const tsPred = topScorerPredictions[member.uid]
        if (tsResult && tsPred) {
          const goalsOk = String(tsPred.goals) === String(tsResult.goals)
          const teamOk = tsPred.team === tsResult.team
          const jerseyOk = String(tsPred.jerseyNumber) === String(tsResult.jerseyNumber)
          finalistBonus += (goalsOk ? 3 : 0) + (teamOk ? 1 : 0) + (jerseyOk ? 1 : 0)
        }
      }

      return {
        uid: member.uid,
        displayName: member.displayName,
        photoURL: member.photoURL,
        paymentStatus: member.paymentStatus || 'pending',
        totalPoints: totalPoints + finalistBonus,
        correctWinners,
        correctScores,
        avgAnticipationHours,
        noParticipation,
        anticipation,
        finalistBonus,
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

  async function saveFinalPrediction(finalTeam1, finalTeam2, winner) {
    const predId = `${groupId}_FINALISTS_${user.uid}`
    const predDoc = { groupId, matchId: 'FINALISTS', uid: user.uid, finalTeam1, finalTeam2, winner, updatedAt: serverTimestamp() }
    await setDoc(doc(db, 'predictions', predId), predDoc)
    setFinalPredictions(prev => ({ ...prev, [user.uid]: { ...predDoc, updatedAt: { seconds: Math.floor(Date.now() / 1000) } } }))
  }

  async function saveThirdPlacePrediction(finalTeam1, finalTeam2, winner) {
    const predId = `${groupId}_THIRD_PLACE_${user.uid}`
    const predDoc = { groupId, matchId: 'THIRD_PLACE', uid: user.uid, finalTeam1, finalTeam2, winner, updatedAt: serverTimestamp() }
    await setDoc(doc(db, 'predictions', predId), predDoc)
    setThirdPlacePredictions(prev => ({ ...prev, [user.uid]: { ...predDoc, updatedAt: { seconds: Math.floor(Date.now() / 1000) } } }))
  }

  async function saveTopScorerPrediction(team, jerseyNumber, goals) {
    const predId = `${groupId}_TOP_SCORER_${user.uid}`
    const predDoc = { groupId, matchId: 'TOP_SCORER', uid: user.uid, team, jerseyNumber, goals, updatedAt: serverTimestamp() }
    await setDoc(doc(db, 'predictions', predId), predDoc)
    setTopScorerPredictions(prev => ({ ...prev, [user.uid]: { ...predDoc, updatedAt: { seconds: Math.floor(Date.now() / 1000) } } }))
  }

  async function updatePaymentAmount(newAmount) {
    await updateDoc(doc(db, 'groups', groupId), { paymentAmount: newAmount })
    setGroup(prev => ({ ...prev, paymentAmount: newAmount }))
  }

  async function updateExtraPaymentAmount(newAmount) {
    await updateDoc(doc(db, 'groups', groupId), { extraPaymentAmount: newAmount })
    setGroup(prev => ({ ...prev, extraPaymentAmount: newAmount }))
  }

  async function updateExtraPaymentStatus(member, newStatus) {
    try {
      await updateDoc(doc(db, 'groupMembers', member.docId), {
        extraPaymentStatus: newStatus,
        extraPaymentReviewedAt: new Date().toISOString(),
        extraPaymentReviewedBy: user.uid,
      })
      setMembers(prev => prev.map(m =>
        m.docId === member.docId ? { ...m, extraPaymentStatus: newStatus } : m
      ))
    } catch (err) {
      console.error('Error actualizando pago extra:', err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
      }
    }
  }

  async function setTopScorerResult(team, jerseyNumber, goals) {
    const result = { team, jerseyNumber, goals }
    await updateDoc(doc(db, 'groups', groupId), { topScorerResult: result })
    setGroup(prev => ({ ...prev, topScorerResult: result }))
  }

  async function revealExtraPoints() {
    if (!confirm('¿Revelar los puntos extra y notificar a todos los jugadores? Esta acción no se puede deshacer.')) return
    await updateDoc(doc(db, 'groups', groupId), { extrasRevealed: true })
    setGroup(prev => ({ ...prev, extrasRevealed: true }))
    await Promise.all(
      visibleMembers.map(m =>
        addDoc(collection(db, 'userNotifications'), {
          userId: m.uid,
          title: group?.name || 'Polla mundialista',
          message: '⭐ Los puntos extra han sido revelados · ¡Revisa tu puntaje!',
          type: 'extra_reveal',
          read: false,
          createdAt: serverTimestamp(),
        })
      )
    )
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
  const myExtraPaymentStatus = myMembership?.extraPaymentStatus || 'pending'
  const isGroupAdmin = group?.adminIds?.includes(user.uid)
  const isGroupPaid = group?.isPaid !== false
  const isPaymentConfirmed = !isGroupPaid || myPaymentStatus === 'confirmed' || isGroupAdmin
  const paymentAmount = group?.paymentAmount || 30000
  const extraPaymentAmount = group?.extraPaymentAmount || 10000
  const extrasPaymentBlocked = isGroupPaid && !(myExtraPaymentStatus === 'confirmed' || isGroupAdmin)

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

  // La Final: deadline y revelacion
  const isFinalistLocked = Date.now() >= FINAL_PRED_DEADLINE.getTime()
  const isThirdPlaceLocked = isFinalistLocked
  const isThirdPlaceRevealed = MATCHES.some(m => m.stage === 'sf' && hasMatchStarted(m))
  const isTopScorerRevealed = isThirdPlaceRevealed
  const thirdPlaceMatch = MATCHES.find(m => m.stage === '3rd')
  const thirdPlaceResult = thirdPlaceMatch && matchResults[thirdPlaceMatch.id]?.isFinished ? matchResults[thirdPlaceMatch.id] : null
  const isFinalistRevealed = MATCHES.some(m => m.stage === 'qf' && hasMatchStarted(m))
  // Revelar predicciones en pestaña Grupo: 28 jun 13:00 COL = 28 jun 18:00 UTC
  const isFinalistVisibleInGroup = Date.now() >= new Date('2026-06-28T18:00:00Z').getTime()
  // Puntos extra: revelados manualmente por admin; botón habilitado cuando la final termina
  const extrasRevealed = group?.extrasRevealed === true
  const finalIsFinished = matchResults['FINAL']?.isFinished === true
  const canRevealExtras = finalIsFinished && !extrasRevealed

  // Tres categorias de partidos (controlado por el admin)
  const liveMatches = filteredMatches.filter(m => matchResults[m.id]?.isLive)
  const playedMatches = filteredMatches.filter(m => matchResults[m.id]?.isFinished && !matchResults[m.id]?.isLive)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || (b.matchNum || 0) - (a.matchNum || 0))
  const upcomingMatches = filteredMatches.filter(m => !matchResults[m.id]?.isLive && !matchResults[m.id]?.isFinished)

  // Estado de secciones colapsables
  const hasAnyLive = liveMatches.length > 0
  const [expandedSections, setExpandedSections] = useState({ live: true, upcoming: true, played: false, finalPred: true, thirdPlace: true, topScorer: true })
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))

  // Cuando hay partidos en curso, colapsar las otras secciones
  useEffect(() => {
    if (hasAnyLive) {
      setExpandedSections({ live: true, upcoming: false, played: false })
    } else {
      setExpandedSections({ live: true, upcoming: true, played: false })
    }
  }, [hasAnyLive])

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
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'members' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📑 Resultados
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'leaderboard' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            🏆 Podio
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'stats' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📊 Tabla
          </button>
          <button
            onClick={() => setActiveTab('final')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'final' ? 'border-wc-gold text-wc-gold' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            ⭐ Puntos extra
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
                    ? 'El admin está revisando tu comprobante.'
                    : myPaymentStatus === 'rejected'
                    ? 'Tu comprobante fue rechazado. Sube uno nuevo.'
                    : 'Completa tu cuota de participación para pronosticar.'}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex-shrink-0 px-4 py-2 rounded-lg bg-wc-gold text-wc-dark font-bold text-xs"
              >
                {myPaymentStatus === 'rejected' ? 'Resubir' : myPaymentStatus === 'uploaded' ? 'Ver estado' : 'Quiero Pronosticar'}
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

            {/* En curso (1st) */}
            {liveMatches.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('live')}
                  className="w-full text-left font-bold text-sm mb-3 flex items-center gap-2 text-white"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  En curso ({liveMatches.length})
                  <span className={`ml-auto text-gray-500 text-xs transition-transform ${expandedSections.live ? 'rotate-90' : ''}`}>▶</span>
                </button>
                {expandedSections.live && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {liveMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={{ ...match, ...matchResults[match.id] }}
                        prediction={predictions[match.id]}
                        onPredict={null}
                        isLive
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Próximos partidos (2nd) */}
            {upcomingMatches.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('upcoming')}
                  className="w-full text-left font-bold text-sm mb-3 flex items-center gap-2 text-white"
                >
                  <span className="w-2 h-2 bg-wc-gold rounded-full"></span>
                  Próximos partidos ({upcomingMatches.length})
                  <span className={`ml-auto text-gray-500 text-xs transition-transform ${expandedSections.upcoming ? 'rotate-90' : ''}`}>▶</span>
                </button>
                {expandedSections.upcoming && (
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
                )}
              </div>
            )}

            {/* Partidos jugados (3rd) */}
            {playedMatches.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('played')}
                  className="w-full text-left font-bold text-sm mb-3 flex items-center gap-2 text-white"
                >
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Partidos jugados ({playedMatches.length})
                  <span className={`ml-auto text-gray-500 text-xs transition-transform ${expandedSections.played ? 'rotate-90' : ''}`}>▶</span>
                </button>
                {expandedSections.played && (
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
                )}
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">🏆 Ranking Ganadores</h2>
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
              <h2 className="text-white font-bold text-lg">📊 Tabla de posiciones</h2>
              <span className="text-gray-400 text-xs">{finishedMatchCount} partidos jugados</span>
            </div>
            <StatsTable scores={scores} currentUserId={user.uid} isPaid={isGroupPaid} />
          </div>
        )}

        {/* FINAL TAB */}
        {activeTab === 'final' && (
          <div>
            <h2 className="text-white font-bold text-lg mb-4">⭐ Puntos extra</h2>

            {!isFinalistLocked && (
              <CountdownBanner deadline={FINAL_PRED_DEADLINE.getTime()} label="Cierra 28 jun · 12:00 AM" />
            )}

            {/* No-admin: estado del pago extra (independiente al pago inicial) */}
            {!isGroupAdmin && isGroupPaid && myMembership && (() => {
              if (!isPaymentConfirmed) {
                return (
                  <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 mb-4">
                    <div className="text-gray-400 font-bold text-sm">Pago inicial pendiente</div>
                    <p className="text-gray-500 text-xs mt-0.5">Primero confirma tu pago de la polla para acceder a los puntos extra</p>
                  </div>
                )
              }
              const statusMap = {
                confirmed: {
                  bg: 'bg-green-900/20 border-green-700',
                  label: '✅ Puntos extra habilitados',
                  desc: 'Ya puedes realizar tus predicciones de puntos extra',
                  labelColor: 'text-green-300',
                },
                pending: {
                  bg: 'bg-yellow-900/20 border-yellow-700',
                  label: `Puntos extra · $${extraPaymentAmount.toLocaleString('es-CO')} COP adicionales`,
                  desc: 'Realiza el pago y notifica al admin para habilitarte',
                  labelColor: 'text-yellow-300',
                },
              }
              const cfg = statusMap[myExtraPaymentStatus] || statusMap.pending
              return (
                <div className={`border rounded-xl p-4 mb-4 ${cfg.bg}`}>
                  <div className={`font-bold text-sm ${cfg.labelColor}`}>{cfg.label}</div>
                  <p className="text-gray-400 text-xs mt-0.5">{cfg.desc}</p>
                </div>
              )
            })()}

            {/* La final */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('finalPred')}
                className="w-full text-left font-bold text-sm mb-3 flex items-center gap-2 text-white"
              >
                🏟️ La final
                <span className="text-gray-500 text-xs italic font-normal">+5 pts</span>
                <span className={`ml-auto text-gray-500 text-xs transition-transform ${expandedSections.finalPred ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expandedSections.finalPred && (
                <FinalPredictionCard
                  prediction={finalPredictions[user.uid]}
                  onSave={saveFinalPrediction}
                  isLocked={isFinalistLocked}
                  isRevealed={isFinalistRevealed}
                  allFinalPredictions={finalPredictions}
                  visibleMembers={visibleMembers}
                  currentUserId={user.uid}
                  finalResult={matchResults['FINAL']?.isFinished ? matchResults['FINAL'] : null}
                  label1="Finalista 1"
                  label2="Finalista 2"
                  paymentBlocked={extrasPaymentBlocked}
                  paymentBlockedMessage="El admin debe habilitarte para los puntos extra"
                />
              )}
            </div>

            {/* Tercer puesto */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('thirdPlace')}
                className="w-full text-left font-bold text-sm mb-3 flex items-center gap-2 text-white"
              >
                🥉 Tercer puesto
                <span className="text-gray-500 text-xs italic font-normal">+5 pts</span>
                <span className={`ml-auto text-gray-500 text-xs transition-transform ${expandedSections.thirdPlace ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expandedSections.thirdPlace && (
                <FinalPredictionCard
                  prediction={thirdPlacePredictions[user.uid]}
                  onSave={saveThirdPlacePrediction}
                  isLocked={isThirdPlaceLocked}
                  isRevealed={isThirdPlaceRevealed}
                  allFinalPredictions={thirdPlacePredictions}
                  visibleMembers={visibleMembers}
                  currentUserId={user.uid}
                  finalResult={thirdPlaceResult}
                  label1="Equipo 1"
                  label2="Equipo 2"
                  paymentBlocked={extrasPaymentBlocked}
                  paymentBlockedMessage="El admin debe habilitarte para los puntos extra"
                />
              )}
            </div>

            {/* Goleador del mundial */}
            <div>
              <button
                onClick={() => toggleSection('topScorer')}
                className="w-full text-left font-bold text-sm mb-3 flex items-center gap-2 text-white"
              >
                ⚽ Goleador del mundial
                <span className="text-gray-500 text-xs italic font-normal">+5 pts</span>
                <span className={`ml-auto text-gray-500 text-xs transition-transform ${expandedSections.topScorer ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expandedSections.topScorer && (
                <>
                  <TopScorerPredictionCard
                    prediction={topScorerPredictions[user.uid]}
                    onSave={saveTopScorerPrediction}
                    isLocked={isFinalistLocked}
                    isRevealed={isTopScorerRevealed}
                    allPredictions={topScorerPredictions}
                    visibleMembers={visibleMembers}
                    currentUserId={user.uid}
                    topScorerResult={group?.topScorerResult || null}
                    paymentBlocked={extrasPaymentBlocked}
                    paymentBlockedMessage="El admin debe habilitarte para los puntos extra"
                  />
                  {isGroupAdmin && (
                    <AdminTopScorerResult
                      current={group?.topScorerResult}
                      onSave={setTopScorerResult}
                    />
                  )}
                </>
              )}
            </div>

            {/* Admin: botón revelar puntos */}
            {isGroupAdmin && (
              <div className="mt-6 bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="text-white font-semibold text-sm mb-1">Revelar puntos extra</div>
                <p className="text-gray-400 text-xs mb-3">
                  {extrasRevealed
                    ? '✅ Los puntos extra ya fueron revelados y sumados al ranking'
                    : finalIsFinished
                    ? 'El mundial terminó. Puedes revelar los puntos y notificar a todos los jugadores.'
                    : 'Este botón se habilita cuando el partido final esté marcado como terminado.'}
                </p>
                {!extrasRevealed && (
                  <button
                    onClick={revealExtraPoints}
                    disabled={!canRevealExtras}
                    className="w-full py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-40 hover:bg-yellow-400 transition-colors"
                  >
                    ⭐ Revelar puntos y notificar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">📑 Resultados de la fecha</h2>
            </div>
            {activeDateMatches.length > 0 && (
              <div className="text-gray-400 text-xs font-semibold mb-2">
                Resultados - Fecha {fechaNumber}
              </div>
            )}
            <div className="space-y-2 mb-6">
              {(() => {
                const scoreMap = Object.fromEntries(scores.map(s => [s.uid, s]))
                return [...visibleMembers]
                  .filter(m => {
                    const preds = allPredictions[m.uid]
                    return preds && Object.keys(preds).length > 0
                  })
                  .sort((a, b) => {
                    const sa = scoreMap[a.uid] || {}
                    const sb = scoreMap[b.uid] || {}
                    if ((sb.totalPoints ?? 0) !== (sa.totalPoints ?? 0)) return (sb.totalPoints ?? 0) - (sa.totalPoints ?? 0)
                    if ((sb.correctScores ?? 0) !== (sa.correctScores ?? 0)) return (sb.correctScores ?? 0) - (sa.correctScores ?? 0)
                    if ((sb.correctWinners ?? 0) !== (sa.correctWinners ?? 0)) return (sb.correctWinners ?? 0) - (sa.correctWinners ?? 0)
                    if ((sa.noParticipation ?? 0) !== (sb.noParticipation ?? 0)) return (sa.noParticipation ?? 0) - (sb.noParticipation ?? 0)
                    if ((sb.anticipation ?? 0) !== (sa.anticipation ?? 0)) return (sb.anticipation ?? 0) - (sa.anticipation ?? 0)
                    return (sb.avgAnticipationHours ?? 0) - (sa.avgAnticipationHours ?? 0)
                  })
              })().map(m => (
                <div key={m.uid} className="bg-gray-900 rounded-xl p-3 border border-gray-700">
                  <div className="flex items-center gap-3">
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
                        {m.uid === user.uid && <span className="text-wc-gold text-xs ml-1">(tu)</span>}
                      </div>
                    </div>
                    {isFinalistVisibleInGroup && (() => {
                      const fp = finalPredictions[m.uid]
                      if (!fp) return null
                      return (
                        <div className="flex items-center gap-1 shrink-0 bg-purple-900/30 border border-purple-800/50 rounded-lg px-2 py-1">
                          <span className="text-purple-400 text-[10px] font-bold">Final</span>
                          <span className="text-sm">{FLAGS[fp.finalTeam1]}</span>
                          <span className="text-gray-500 text-[10px]">vs</span>
                          <span className="text-sm">{FLAGS[fp.finalTeam2]}</span>
                        </div>
                      )
                    })()}
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">💰 Gestión de Pagos</h2>
            </div>

            {/* ── Sección 1: Pago de la polla ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">🏆 Pago de la polla</h3>
                <span className="text-gray-400 text-xs">
                  {visibleMembers.filter(m => (m.paymentStatus || 'pending') === 'confirmed').length}/{visibleMembers.length} habilitados
                </span>
              </div>
              <AdminPaymentAmountEditor amount={paymentAmount} onSave={updatePaymentAmount} label="Inscripción a la polla" />
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
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                      {m.receiptData ? (
                        <div className="px-3 pb-3">
                          <div className="bg-gray-800 rounded-lg p-3 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-xs">Monto verificado</span>
                              <span className="text-white font-bold text-sm">${m.receiptData.amount?.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-xs">Destino</span>
                              <span className="text-white text-xs">
                                {m.receiptData.destType === 'nequi' ? 'Nequi detectado' : m.receiptData.destType === 'nombre' ? 'Nombre detectado' : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-xs">Fecha envío</span>
                              <span className="text-white text-xs">
                                {m.receiptData.submittedAt
                                  ? new Date(m.receiptData.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : '—'}
                              </span>
                            </div>
                          </div>
                          {pStatus === 'uploaded' && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => updatePaymentStatus(m, 'confirmed')} className="flex-1 text-xs py-2 rounded-lg bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800 font-bold transition-colors">Confirmar pago</button>
                              <button onClick={() => updatePaymentStatus(m, 'rejected')} className="flex-1 text-xs py-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900 border border-red-800 font-bold transition-colors">Rechazar</button>
                            </div>
                          )}
                          {pStatus === 'rejected' && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => updatePaymentStatus(m, 'confirmed')} className="flex-1 text-xs py-2 rounded-lg bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800 font-bold transition-colors">Confirmar pago</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-3 pb-3">
                          <div className="text-gray-500 text-xs italic">No ha enviado comprobante</div>
                          {pStatus !== 'confirmed' && (
                            <button onClick={() => updatePaymentStatus(m, 'confirmed')} className="mt-2 text-xs py-1.5 px-3 rounded-lg bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800 font-bold transition-colors">Confirmar manualmente</button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Sección 2: Puntos extra ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">⭐ Puntos extra</h3>
                <span className="text-gray-400 text-xs">
                  {visibleMembers.filter(m => (m.extraPaymentStatus || 'pending') === 'confirmed').length}/{visibleMembers.filter(m => (m.paymentStatus || 'pending') === 'confirmed').length} habilitados
                </span>
              </div>
              <AdminPaymentAmountEditor amount={extraPaymentAmount} onSave={updateExtraPaymentAmount} label="Puntos extra" />
              <p className="text-gray-500 text-xs mb-3">Solo aparecen jugadores con pago de polla confirmado</p>
              <div className="space-y-2">
                {visibleMembers
                  .filter(m => (m.paymentStatus || 'pending') === 'confirmed')
                  .sort((a, b) => {
                    const order = { pending: 0, confirmed: 1 }
                    return (order[a.extraPaymentStatus] ?? 0) - (order[b.extraPaymentStatus] ?? 0)
                  })
                  .map(m => {
                    const eStatus = m.extraPaymentStatus || 'pending'
                    const isExtraConfirmed = eStatus === 'confirmed'
                    return (
                      <div key={m.uid} className="bg-gray-900 rounded-xl border border-gray-700 flex items-center gap-3 p-3">
                        {m.photoURL ? (
                          <img src={m.photoURL} alt={m.displayName} className="w-10 h-10 rounded-full border border-gray-600" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-wc-green flex items-center justify-center text-white font-bold">
                            {m.displayName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm truncate">{m.displayName}</div>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${isExtraConfirmed ? 'text-green-400 bg-green-900/30 border-green-700' : 'text-yellow-400 bg-yellow-900/30 border-yellow-700'}`}>
                            {isExtraConfirmed ? 'Habilitado' : 'Pendiente'}
                          </span>
                        </div>
                        {!isExtraConfirmed ? (
                          <button
                            onClick={() => updateExtraPaymentStatus(m, 'confirmed')}
                            className="text-xs py-1.5 px-3 rounded-lg bg-green-900/50 text-green-400 hover:bg-green-900 border border-green-800 font-bold transition-colors shrink-0"
                          >
                            Habilitar
                          </button>
                        ) : (
                          <button
                            onClick={() => updateExtraPaymentStatus(m, 'pending')}
                            className="text-xs py-1.5 px-3 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-600 transition-colors shrink-0"
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    )
                  })}
                {visibleMembers.filter(m => (m.paymentStatus || 'pending') === 'confirmed').length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-4">Ningún jugador ha confirmado el pago inicial aún</p>
                )}
              </div>
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
          groupName={group?.name}
          adminIds={group?.adminIds || []}
          memberName={user?.displayName}
          paymentAmount={paymentAmount}
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

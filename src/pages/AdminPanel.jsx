import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, getDoc, getDocs, addDoc, collection, query, where, serverTimestamp, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MATCHES, STAGE_NAMES, FLAGS, ALL_TEAMS, hasMatchStarted } from '../data/matches'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatRelativeTime(dateStr) {
  const diff = new Date(dateStr) - Date.now()
  if (diff <= 0) return 'Por iniciar'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Inicia en ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Inicia en ${hours}h`
  const days = Math.floor(hours / 24)
  return `Inicia en ${days}d`
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
  // Notification state
  const [showNotifSection, setShowNotifSection] = useState(false)
  const [notifType, setNotifType] = useState('info')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [notifHistory, setNotifHistory] = useState([])
  const [sendingFollowup, setSendingFollowup] = useState(false)

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

  // --- Notificaciones ---

  async function loadNotifHistory() {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10))
      const snap = await getDocs(q)
      setNotifHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Error cargando historial:', err)
    }
  }

  useEffect(() => {
    if (showNotifSection) loadNotifHistory()
  }, [showNotifSection])

  async function getUniqueUserIds(filter) {
    // Obtener todos los groupMembers
    const snap = await getDocs(collection(db, 'groupMembers'))
    const members = snap.docs.map(d => d.data())

    // Obtener todos los grupos para saber cuáles son de pago
    const groupSnap = await getDocs(collection(db, 'groups'))
    const groupMap = {}
    groupSnap.docs.forEach(d => { groupMap[d.id] = d.data() })

    const uidSet = new Set()
    members.forEach(m => {
      if (filter === 'all') {
        uidSet.add(m.uid)
      } else if (filter === 'payment_pending') {
        const group = groupMap[m.groupId]
        const isGroupPaid = group?.isPaid !== false
        const isAdmin = group?.adminIds?.includes(m.uid)
        if (isGroupPaid && !isAdmin && (m.paymentStatus || 'pending') !== 'confirmed') {
          uidSet.add(m.uid)
        }
      }
    })
    return [...uidSet]
  }

  async function sendNotification() {
    if (!notifTitle.trim() || !notifMessage.trim()) return
    setSendingNotif(true)
    try {
      const targetType = notifType === 'payment' ? 'payment_pending' : 'all'
      const userIds = await getUniqueUserIds(targetType)

      // Crear registro en notifications (historial)
      const notifRef = await addDoc(collection(db, 'notifications'), {
        type: notifType,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        targetType,
        targetUserIds: userIds,
      })

      // Fan-out: crear userNotification para cada destino
      await Promise.all(
        userIds.map(uid =>
          addDoc(collection(db, 'userNotifications'), {
            userId: uid,
            notificationId: notifRef.id,
            type: notifType,
            title: notifTitle.trim(),
            message: notifMessage.trim(),
            createdAt: serverTimestamp(),
            read: false,
          })
        )
      )

      setNotifTitle('')
      setNotifMessage('')
      setSuccessMsg(`Notificación enviada a ${userIds.length} usuario${userIds.length !== 1 ? 's' : ''}`)
      setTimeout(() => setSuccessMsg(''), 3000)
      loadNotifHistory()
    } catch (err) {
      console.error('Error enviando notificación:', err)
      setSuccessMsg('Error al enviar la notificación')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setSendingNotif(false)
  }

  async function sendFollowupReminder() {
    setSendingFollowup(true)
    try {
      // Obtener partidos de ayer (zona Colombia UTC-5)
      const now = new Date()
      const colombiaOffset = -5 * 60
      const localNow = new Date(now.getTime() + (colombiaOffset + now.getTimezoneOffset()) * 60000)
      const yesterday = new Date(localNow)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0] // YYYY-MM-DD

      const yesterdayMatches = MATCHES.filter(m => {
        const matchDate = new Date(m.date)
        const matchLocal = new Date(matchDate.getTime() + (colombiaOffset + matchDate.getTimezoneOffset()) * 60000)
        return matchLocal.toISOString().split('T')[0] === yesterdayStr
      })

      if (yesterdayMatches.length === 0) {
        setSuccessMsg('No hubo partidos ayer. No se enviaron recordatorios.')
        setTimeout(() => setSuccessMsg(''), 3000)
        setSendingFollowup(false)
        return
      }

      const yesterdayMatchIds = yesterdayMatches.map(m => m.id)

      // Obtener todos los miembros confirmados (que pueden predecir)
      const membersSnap = await getDocs(collection(db, 'groupMembers'))
      const members = membersSnap.docs.map(d => d.data())

      const groupSnap = await getDocs(collection(db, 'groups'))
      const groupMap = {}
      groupSnap.docs.forEach(d => { groupMap[d.id] = d.data() })

      // Filtrar miembros habilitados (confirmados o en grupo gratuito, no admins)
      const enabledMembers = members.filter(m => {
        const group = groupMap[m.groupId]
        if (!group) return false
        const isGroupPaid = group.isPaid !== false
        const isAdmin = group.adminIds?.includes(m.uid)
        if (isAdmin) return false
        return !isGroupPaid || (m.paymentStatus || 'pending') === 'confirmed'
      })

      // Agrupar por uid → groupIds
      const userGroups = {}
      enabledMembers.forEach(m => {
        if (!userGroups[m.uid]) userGroups[m.uid] = []
        userGroups[m.uid].push(m.groupId)
      })

      // Obtener predicciones de ayer para todos los grupos
      const predSnap = await getDocs(collection(db, 'predictions'))
      const allPreds = predSnap.docs.map(d => d.data())

      // Para cada usuario, verificar si le falta al menos una predicción de ayer en algún grupo
      const usersToNotify = []
      Object.entries(userGroups).forEach(([uid, groupIds]) => {
        const userPreds = allPreds.filter(p => p.uid === uid)
        const hasMissing = groupIds.some(gid => {
          return yesterdayMatchIds.some(mid => {
            return !userPreds.find(p => p.groupId === gid && p.matchId === mid)
          })
        })
        if (hasMissing) usersToNotify.push(uid)
      })

      if (usersToNotify.length === 0) {
        setSuccessMsg('Todos los participantes habilitados hicieron sus pronósticos ayer.')
        setTimeout(() => setSuccessMsg(''), 3000)
        setSendingFollowup(false)
        return
      }

      const title = '¡No olvides tus pronósticos!'
      const message = 'Ayer hubo partidos y no registraste todos tus pronósticos. Mantente pendiente de la app para seguir en competencia.'

      const notifRef = await addDoc(collection(db, 'notifications'), {
        type: 'followup',
        title,
        message,
        createdAt: serverTimestamp(),
        createdBy: 'system',
        targetType: 'user',
        targetUserIds: usersToNotify,
      })

      await Promise.all(
        usersToNotify.map(uid =>
          addDoc(collection(db, 'userNotifications'), {
            userId: uid,
            notificationId: notifRef.id,
            type: 'followup',
            title,
            message,
            createdAt: serverTimestamp(),
            read: false,
          })
        )
      )

      setSuccessMsg(`Recordatorio enviado a ${usersToNotify.length} usuario${usersToNotify.length !== 1 ? 's' : ''} que no pronosticaron ayer`)
      setTimeout(() => setSuccessMsg(''), 4000)
      loadNotifHistory()
    } catch (err) {
      console.error('Error enviando seguimiento:', err)
      setSuccessMsg('Error al enviar recordatorios')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setSendingFollowup(false)
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
              const isKnockout = match.stage !== 'group'
              // Use Firestore-stored team names if available, otherwise use static data
              const displayTeam1 = result?.team1 || match.team1
              const displayTeam2 = result?.team2 || match.team2
              const teamsAssigned = displayTeam1 !== 'Por definir' && displayTeam2 !== 'Por definir'

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
                        <span className="text-lg">{FLAGS[displayTeam1] || '🏳️'}</span>
                        <span className="text-white font-semibold truncate max-w-[90px]">{displayTeam1}</span>
                        {hasResult ? (
                          <span className="text-wc-gold font-black text-base">
                            {result.team1Goals} - {result.team2Goals}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-bold">vs</span>
                        )}
                        <span className="text-white font-semibold truncate max-w-[90px]">{displayTeam2}</span>
                        <span className="text-lg">{FLAGS[displayTeam2] || '🏳️'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-center">
                      {hasResult && (
                        <button
                          onClick={() => clearResult(match.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-800 hover:border-red-700"
                        >
                          Borrar
                        </button>
                      )}
                      {started ? (
                        <button
                          onClick={() => startEdit({ ...match, team1: displayTeam1, team2: displayTeam2 })}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            hasResult
                              ? 'bg-gray-700 text-wc-gold hover:bg-gray-600'
                              : 'bg-wc-gold text-wc-dark hover:bg-yellow-400'
                          }`}
                        >
                          {hasResult ? '✏️ Editar' : '📝 Resultado'}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                        >
                          🔒 {formatRelativeTime(match.date)}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Knockout team assignment */}
                  {isKnockout && !teamsAssigned && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="text-xs text-yellow-400 font-semibold mb-2">Asignar equipos:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={displayTeam1 === 'Por definir' ? '' : displayTeam1}
                          onChange={e => updateKnockoutTeam(match.id, 'team1', e.target.value || 'Por definir')}
                          className="bg-gray-800 text-white text-xs rounded-lg px-2 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                        >
                          <option value="">Equipo 1...</option>
                          {ALL_TEAMS.map(t => (
                            <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                          ))}
                        </select>
                        <select
                          value={displayTeam2 === 'Por definir' ? '' : displayTeam2}
                          onChange={e => updateKnockoutTeam(match.id, 'team2', e.target.value || 'Por definir')}
                          className="bg-gray-800 text-white text-xs rounded-lg px-2 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                        >
                          <option value="">Equipo 2...</option>
                          {ALL_TEAMS.map(t => (
                            <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Show edit option for already-assigned knockout teams */}
                  {isKnockout && teamsAssigned && !hasResult && (
                    <div className="mt-2 pt-2 border-t border-gray-800">
                      <details className="group">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 select-none">
                          Cambiar equipos
                        </summary>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <select
                            value={displayTeam1}
                            onChange={e => updateKnockoutTeam(match.id, 'team1', e.target.value || 'Por definir')}
                            className="bg-gray-800 text-white text-xs rounded-lg px-2 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                          >
                            <option value="">Equipo 1...</option>
                            {ALL_TEAMS.map(t => (
                              <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                            ))}
                          </select>
                          <select
                            value={displayTeam2}
                            onChange={e => updateKnockoutTeam(match.id, 'team2', e.target.value || 'Por definir')}
                            className="bg-gray-800 text-white text-xs rounded-lg px-2 py-2 border border-gray-600 focus:border-wc-gold focus:outline-none"
                          >
                            <option value="">Equipo 2...</option>
                            {ALL_TEAMS.map(t => (
                              <option key={t} value={t}>{FLAGS[t] || '🏳️'} {t}</option>
                            ))}
                          </select>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <button
          onClick={() => setShowNotifSection(!showNotifSection)}
          className="w-full bg-gray-900 rounded-xl border border-gray-700 p-4 flex items-center justify-between hover:border-wc-gold transition-colors"
        >
          <span className="text-wc-gold font-bold text-sm">🔔 Notificaciones</span>
          <span className={`text-gray-400 transition-transform duration-200 ${showNotifSection ? 'rotate-90' : ''}`}>▶</span>
        </button>

        {showNotifSection && (
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-5 mt-2 space-y-5">
            {/* Enviar notificación manual */}
            <div>
              <div className="text-white font-bold text-sm mb-3">Enviar notificación</div>

              {/* Tipo */}
              <div className="flex bg-gray-800 rounded-lg p-1 mb-3">
                <button
                  onClick={() => setNotifType('info')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
                    notifType === 'info' ? 'bg-wc-gold text-wc-dark' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📢 Informativo
                </button>
                <button
                  onClick={() => setNotifType('payment')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
                    notifType === 'payment' ? 'bg-wc-gold text-wc-dark' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  💰 Pago pendiente
                </button>
              </div>

              <p className="text-gray-500 text-xs mb-3">
                {notifType === 'info'
                  ? 'Se enviará a todos los participantes de todos los grupos.'
                  : 'Se enviará solo a usuarios con pago pendiente en grupos de pago.'}
              </p>

              <input
                type="text"
                placeholder="Título de la notificación"
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none text-sm mb-2"
                maxLength={80}
              />
              <textarea
                placeholder="Mensaje..."
                value={notifMessage}
                onChange={e => setNotifMessage(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none text-sm resize-none"
                rows={3}
                maxLength={300}
              />
              <button
                onClick={sendNotification}
                disabled={!notifTitle.trim() || !notifMessage.trim() || sendingNotif}
                className="w-full mt-3 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50 hover:bg-yellow-400 transition-colors"
              >
                {sendingNotif ? 'Enviando...' : 'Enviar notificación'}
              </button>
            </div>

            <div className="border-t border-gray-700" />

            {/* Seguimiento automático */}
            <div>
              <div className="text-white font-bold text-sm mb-2">Recordatorio de pronósticos</div>
              <p className="text-gray-500 text-xs mb-3">
                Detecta usuarios que no hicieron pronóstico en los partidos de ayer y les envía un recordatorio automático.
              </p>
              <button
                onClick={sendFollowupReminder}
                disabled={sendingFollowup}
                className="w-full py-2.5 rounded-lg bg-wc-green text-white font-bold text-sm disabled:opacity-50 hover:bg-green-700 transition-colors"
              >
                {sendingFollowup ? 'Analizando y enviando...' : '⚽ Enviar recordatorio de pronósticos de ayer'}
              </button>
            </div>

            {/* Historial */}
            {notifHistory.length > 0 && (
              <>
                <div className="border-t border-gray-700" />
                <div>
                  <div className="text-white font-bold text-sm mb-3">Historial reciente</div>
                  <div className="space-y-2">
                    {notifHistory.map(n => {
                      const ts = n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt ? new Date(n.createdAt) : null
                      const typeLabel = n.type === 'info' ? '📢' : n.type === 'payment' ? '💰' : '⚽'
                      return (
                        <div key={n.id} className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{typeLabel}</span>
                            <span className="text-white text-xs font-semibold truncate">{n.title}</span>
                            <span className="text-gray-500 text-xs ml-auto shrink-0">
                              {n.targetUserIds?.length || 0} dest.
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">{n.message}</p>
                          {ts && (
                            <div className="text-gray-600 text-xs mt-1">
                              {ts.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
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

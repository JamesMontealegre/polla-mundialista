import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc, serverTimestamp, orderBy, limit
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MATCHES } from '../data/matches'
import { HIDDEN_EMAILS } from '../config/hiddenUsers'


function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Home() {
  const { user, isAdmin, handlePermissionError } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newGroupIsPaid, setNewGroupIsPaid] = useState(true)
  const [deletingGroupId, setDeletingGroupId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // Notification state (admin)
  const [showNotifForm, setShowNotifForm] = useState(false)
  const [notifType, setNotifType] = useState('info')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [sendingFollowup, setSendingFollowup] = useState(false)
  const [notifSuccess, setNotifSuccess] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [user])

  async function fetchGroups() {
    setLoading(true)
    try {
      // Buscar grupos donde el usuario es miembro
      const q = query(
        collection(db, 'groupMembers'),
        where('uid', '==', user.uid)
      )
      const snap = await getDocs(q)
      // Save membership data keyed by groupId for payment badge
      const membershipMap = {}
      snap.docs.forEach(d => {
        const data = d.data()
        membershipMap[data.groupId] = data
      })
      const groupIds = Object.keys(membershipMap)

      if (groupIds.length === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      // Cargar info de cada grupo
      const groupDocs = await Promise.all(
        groupIds.map(id => getDoc(doc(db, 'groups', id)))
      )
      const groupsList = groupDocs
        .filter(d => d.exists())
        .map(d => ({ id: d.id, ...d.data(), myPaymentStatus: membershipMap[d.id]?.paymentStatus || 'pending' }))

      // For paid admin groups, fetch member payment stats
      const adminGroups = groupsList.filter(g => g.adminIds?.includes(user.uid) && g.isPaid !== false)
      if (adminGroups.length > 0) {
        const memberSnaps = await Promise.all(
          adminGroups.map(g => getDocs(query(collection(db, 'groupMembers'), where('groupId', '==', g.id))))
        )
        // Obtener emails de todos los miembros para filtrar perfiles ocultos
        const allMemberUids = new Set()
        memberSnaps.forEach(snap => snap.docs.forEach(d => allMemberUids.add(d.data().uid)))
        const uidList = [...allMemberUids]
        const userDocs = await Promise.all(uidList.map(uid => getDoc(doc(db, 'users', uid))))
        const emailByUid = {}
        userDocs.forEach((uDoc, i) => {
          if (uDoc.exists()) emailByUid[uidList[i]] = uDoc.data().email || null
        })

        adminGroups.forEach((g, i) => {
          const allMembers = memberSnaps[i].docs.map(d => d.data())
          const visible = allMembers.filter(m =>
            !(g.adminIds || []).includes(m.uid) && !HIDDEN_EMAILS.has(emailByUid[m.uid])
          )
          g.paymentConfirmed = visible.filter(m => (m.paymentStatus || 'pending') === 'confirmed').length
          g.paymentTotal = visible.length
        })
      }

      setGroups(groupsList)
    } catch (err) {
      console.error('Error cargando grupos:', err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
        return
      }
    }
    setLoading(false)
  }

  async function createGroup() {
    if (!newGroupName.trim()) return
    setCreating(true)
    try {
      const inviteCode = generateInviteCode()
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: newGroupName.trim(),
        inviteCode,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        adminIds: [user.uid],
        isPaid: newGroupIsPaid,
      })
      // Agregar al creador como miembro (auto-confirmado)
      await addDoc(collection(db, 'groupMembers'), {
        groupId: groupRef.id,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        joinedAt: serverTimestamp(),
        paymentStatus: 'confirmed',
        receiptURL: null,
      })
      setNewGroupName('')
      setNewGroupIsPaid(true)
      setShowCreate(false)
      fetchGroups()
    } catch (err) {
      console.error('Error creando grupo:', err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
        return
      }
    }
    setCreating(false)
  }

  async function deleteGroup(groupId) {
    setDeleting(true)
    try {
      // 1. Borrar predicciones del grupo
      const predsSnap = await getDocs(
        query(collection(db, 'predictions'), where('groupId', '==', groupId))
      )
      await Promise.all(predsSnap.docs.map(d => deleteDoc(d.ref)))

      // 2. Borrar miembros del grupo
      const membersSnap = await getDocs(
        query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
      )
      await Promise.all(membersSnap.docs.map(d => deleteDoc(d.ref)))

      // 3. Borrar el grupo
      await deleteDoc(doc(db, 'groups', groupId))

      setGroups(prev => prev.filter(g => g.id !== groupId))
      setDeletingGroupId(null)
    } catch (err) {
      console.error('Error eliminando grupo:', err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
        return
      }
    }
    setDeleting(false)
  }

  // --- Notification helpers (admin only) ---

  async function getUniqueUserIds(filter) {
    const snap = await getDocs(collection(db, 'groupMembers'))
    const members = snap.docs.map(d => d.data())
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
        const isGrpAdmin = group?.adminIds?.includes(m.uid)
        if (isGroupPaid && !isGrpAdmin && (m.paymentStatus || 'pending') !== 'confirmed') {
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

      const notifRef = await addDoc(collection(db, 'notifications'), {
        type: notifType,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        targetType,
        targetUserIds: userIds,
      })

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
      setNotifType('info')
      setShowNotifForm(false)
      setNotifSuccess(`Notificación enviada a ${userIds.length} usuario${userIds.length !== 1 ? 's' : ''}`)
      setTimeout(() => setNotifSuccess(''), 3000)
    } catch (err) {
      console.error('Error enviando notificación:', err)
      setNotifSuccess('Error al enviar la notificación')
      setTimeout(() => setNotifSuccess(''), 3000)
    }
    setSendingNotif(false)
  }

  async function sendFollowupReminder() {
    setSendingFollowup(true)
    try {
      const now = new Date()
      const colombiaOffset = -5 * 60
      const localNow = new Date(now.getTime() + (colombiaOffset + now.getTimezoneOffset()) * 60000)
      const yesterday = new Date(localNow)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const yesterdayMatches = MATCHES.filter(m => {
        const matchDate = new Date(m.date)
        const matchLocal = new Date(matchDate.getTime() + (colombiaOffset + matchDate.getTimezoneOffset()) * 60000)
        return matchLocal.toISOString().split('T')[0] === yesterdayStr
      })

      if (yesterdayMatches.length === 0) {
        setNotifSuccess('No hubo partidos ayer. No se enviaron recordatorios.')
        setTimeout(() => setNotifSuccess(''), 3000)
        setSendingFollowup(false)
        return
      }

      const yesterdayMatchIds = yesterdayMatches.map(m => m.id)

      const membersSnap = await getDocs(collection(db, 'groupMembers'))
      const members = membersSnap.docs.map(d => d.data())
      const groupSnap = await getDocs(collection(db, 'groups'))
      const groupMap = {}
      groupSnap.docs.forEach(d => { groupMap[d.id] = d.data() })

      const enabledMembers = members.filter(m => {
        const group = groupMap[m.groupId]
        if (!group) return false
        const isGroupPaid = group.isPaid !== false
        const isGrpAdmin = group.adminIds?.includes(m.uid)
        if (isGrpAdmin) return false
        return !isGroupPaid || (m.paymentStatus || 'pending') === 'confirmed'
      })

      const userGroups = {}
      enabledMembers.forEach(m => {
        if (!userGroups[m.uid]) userGroups[m.uid] = []
        userGroups[m.uid].push(m.groupId)
      })

      const predSnap = await getDocs(collection(db, 'predictions'))
      const allPreds = predSnap.docs.map(d => d.data())

      const usersToNotify = []
      Object.entries(userGroups).forEach(([uid, groupIds]) => {
        const userPreds = allPreds.filter(p => p.uid === uid)
        const hasMissing = groupIds.some(gid =>
          yesterdayMatchIds.some(mid => !userPreds.find(p => p.groupId === gid && p.matchId === mid))
        )
        if (hasMissing) usersToNotify.push(uid)
      })

      if (usersToNotify.length === 0) {
        setNotifSuccess('Todos los participantes hicieron sus pronósticos ayer.')
        setTimeout(() => setNotifSuccess(''), 3000)
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

      setNotifSuccess(`Recordatorio enviado a ${usersToNotify.length} usuario${usersToNotify.length !== 1 ? 's' : ''}`)
      setTimeout(() => setNotifSuccess(''), 4000)
    } catch (err) {
      console.error('Error enviando seguimiento:', err)
      setNotifSuccess('Error al enviar recordatorios')
      setTimeout(() => setNotifSuccess(''), 3000)
    }
    setSendingFollowup(false)
  }

  return (
    <div className="min-h-screen bg-wc-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-wc-green/30 to-wc-dark py-8 px-4 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h1 className="text-2xl font-black text-white">
          Bienvenido, <span className="text-wc-gold">{user.displayName?.split(' ')[0]}</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          El Mundial 2026 ya empezó · ¡Haz tus predicciones!
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Quick actions */}
        <div className={`grid gap-3 ${!isAdmin ? 'grid-cols-1' : 'grid-cols-1'}`}>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-wc-green text-white rounded-xl p-4 text-left hover:bg-green-700 transition-colors"
            >
              <div className="text-2xl mb-1">➕</div>
              <div className="font-bold text-sm">Crear Grupo</div>
              <div className="text-xs text-green-200 mt-0.5">Invita a tus amigos</div>
            </button>
          )}
          {!isAdmin && (
            <button
              onClick={() => navigate('/join')}
              className="bg-gray-800 text-white rounded-xl p-4 text-left hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <div className="text-2xl mb-1">🔗</div>
              <div className="font-bold text-sm">Unirse a Grupo</div>
              <div className="text-xs text-gray-400 mt-0.5">Con código de invitación</div>
            </button>
          )}
        </div>

        {/* Create group modal */}
        {showCreate && (
          <div className="bg-gray-900 rounded-2xl border border-wc-green p-5 space-y-4">
            <h3 className="text-white font-bold text-lg">🆕 Crear nuevo grupo</h3>
            <input
              type="text"
              placeholder="Nombre del grupo (ej: Los Crack)"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createGroup()}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-wc-gold focus:outline-none text-sm"
              maxLength={40}
            />
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setNewGroupIsPaid(true)}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
                  newGroupIsPaid ? 'bg-wc-gold text-wc-dark' : 'text-gray-400 hover:text-white'
                }`}
              >
                Con inscripcion ($30.000)
              </button>
              <button
                onClick={() => setNewGroupIsPaid(false)}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
                  !newGroupIsPaid ? 'bg-wc-gold text-wc-dark' : 'text-gray-400 hover:text-white'
                }`}
              >
                Gratuito
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreate(false); setNewGroupName(''); setNewGroupIsPaid(true) }}
                className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim() || creating}
                className="flex-1 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        )}

        {/* Groups list */}
        <div>
          <h2 className="text-white font-bold text-lg mb-3">Mis Grupos</h2>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Cargando...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-10 bg-gray-900 rounded-2xl border border-gray-700">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-400 text-sm">No perteneces a ningún grupo aún.</p>
              <p className="text-gray-500 text-xs mt-1">Crea uno o únete con un código de invitación.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden transition-all hover:border-wc-green">
                  {deletingGroupId === group.id ? (
                    <div className="p-4 border-l-4 border-red-600">
                      <p className="text-gray-300 text-sm mb-1">¿Eliminar el grupo <span className="text-white font-bold">{group.name}</span>?</p>
                      <p className="text-red-400 text-xs mb-3">Se borrarán todos los miembros y predicciones. Esta acción no se puede deshacer.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeletingGroupId(null)}
                          disabled={deleting}
                          className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => deleteGroup(group.id)}
                          disabled={deleting}
                          className="flex-1 py-2 rounded-lg bg-red-700 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50"
                        >
                          {deleting ? 'Eliminando...' : 'Sí, eliminar grupo'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        onClick={() => navigate(`/group/${group.id}`)}
                        className="flex-1 p-4 text-left hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold">{group.name}</div>
                            <div className="text-gray-400 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>Código: <span className="text-wc-gold font-mono font-bold">{group.inviteCode}</span></span>
                              {group.isPaid === false ? (
                                <span className="text-gray-400">Gratuito</span>
                              ) : group.adminIds?.includes(user.uid) ? (
                                <>
                                  <span className="text-wc-green">Admin</span>
                                  {group.paymentTotal != null && (
                                    <span className={group.paymentConfirmed === group.paymentTotal ? 'text-green-400' : 'text-yellow-400'}>
                                      {group.paymentConfirmed}/{group.paymentTotal} pagos
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  {group.myPaymentStatus === 'confirmed' ? (
                                    <span className="text-green-400">Habilitado</span>
                                  ) : group.myPaymentStatus === 'uploaded' ? (
                                    <span className="text-blue-400">En revision</span>
                                  ) : group.myPaymentStatus === 'rejected' ? (
                                    <span className="text-red-400">Rechazado</span>
                                  ) : (
                                    <span className="text-yellow-400">Pago pendiente</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-gray-500 text-lg">›</div>
                        </div>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeletingGroupId(group.id)}
                          className="px-3 py-4 text-gray-600 hover:text-red-400 transition-colors border-l border-gray-800"
                          title="Eliminar grupo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="space-y-3">
            <div className="text-yellow-300 font-bold text-sm">⚙️ Panel de Administrador</div>

            {notifSuccess && (
              <div className="bg-green-900 border border-green-600 text-green-300 text-sm px-4 py-3 rounded-xl text-center">
                {notifSuccess}
              </div>
            )}

            {/* Two action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-left hover:bg-yellow-900/50 transition-colors"
              >
                <div className="text-2xl mb-1">📝</div>
                <div className="text-yellow-300 font-bold text-sm">Actualizar resultados</div>
                <div className="text-yellow-600 text-xs mt-0.5">Marcadores de partidos</div>
              </button>
              <button
                onClick={() => setShowNotifForm(!showNotifForm)}
                className={`border rounded-xl p-4 text-left transition-colors ${
                  showNotifForm
                    ? 'bg-yellow-900/50 border-wc-gold'
                    : 'bg-yellow-900/30 border-yellow-700 hover:bg-yellow-900/50'
                }`}
              >
                <div className="text-2xl mb-1">🔔</div>
                <div className="text-yellow-300 font-bold text-sm">Enviar notificaciones</div>
                <div className="text-yellow-600 text-xs mt-0.5">Mensajes a participantes</div>
              </button>
            </div>

            {/* Inline notification form */}
            {showNotifForm && (
              <div className="bg-gray-900 rounded-xl border border-yellow-700 p-5 space-y-4">
                {/* Tipo */}
                <div className="flex bg-gray-800 rounded-lg p-1">
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

                <p className="text-gray-500 text-xs">
                  {notifType === 'info'
                    ? 'Se enviará a todos los participantes de todos los grupos.'
                    : 'Se enviará solo a usuarios con pago pendiente en grupos de pago.'}
                </p>

                <input
                  type="text"
                  placeholder="Título de la notificación"
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-600 focus:border-wc-gold focus:outline-none text-sm"
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
                  className="w-full py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50 hover:bg-yellow-400 transition-colors"
                >
                  {sendingNotif ? 'Enviando...' : 'Enviar notificación'}
                </button>

                <div className="border-t border-gray-700" />

                {/* Seguimiento */}
                <div>
                  <div className="text-white font-bold text-sm mb-2">Recordatorio de pronósticos</div>
                  <p className="text-gray-500 text-xs mb-3">
                    Detecta usuarios que no hicieron pronóstico en los partidos de ayer y les envía un recordatorio.
                  </p>
                  <button
                    onClick={sendFollowupReminder}
                    disabled={sendingFollowup}
                    className="w-full py-2.5 rounded-lg bg-wc-green text-white font-bold text-sm disabled:opacity-50 hover:bg-green-700 transition-colors"
                  >
                    {sendingFollowup ? 'Analizando y enviando...' : '⚽ Enviar recordatorio de pronósticos de ayer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

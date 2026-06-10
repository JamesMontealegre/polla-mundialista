import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

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
  const [deletingGroupId, setDeletingGroupId] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

      // For admin groups, fetch member payment stats
      const adminGroups = groupsList.filter(g => g.adminIds?.includes(user.uid))
      if (adminGroups.length > 0) {
        const memberSnaps = await Promise.all(
          adminGroups.map(g => getDocs(query(collection(db, 'groupMembers'), where('groupId', '==', g.id))))
        )
        adminGroups.forEach((g, i) => {
          const allMembers = memberSnaps[i].docs.map(d => d.data())
          const nonAdmins = allMembers.filter(m => !(g.adminIds || []).includes(m.uid))
          g.paymentConfirmed = nonAdmins.filter(m => (m.paymentStatus || 'pending') === 'confirmed').length
          g.paymentTotal = nonAdmins.length
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
        <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
          <button
            onClick={() => navigate('/join')}
            className="bg-gray-800 text-white rounded-xl p-4 text-left hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <div className="text-2xl mb-1">🔗</div>
            <div className="font-bold text-sm">Unirse a Grupo</div>
            <div className="text-xs text-gray-400 mt-0.5">Con código de invitación</div>
          </button>
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
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreate(false); setNewGroupName('') }}
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
                              {group.adminIds?.includes(user.uid) ? (
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
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-300 font-bold text-sm">⚙️ Panel de Administrador</div>
                <div className="text-yellow-500 text-xs mt-0.5">Actualiza resultados de partidos</div>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Ir al Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

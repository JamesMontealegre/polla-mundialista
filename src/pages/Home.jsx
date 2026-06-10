import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp
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
      const groupIds = snap.docs.map(d => d.data().groupId)

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
        .map(d => ({ id: d.id, ...d.data() }))

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
      // Agregar al creador como miembro
      await addDoc(collection(db, 'groupMembers'), {
        groupId: groupRef.id,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        joinedAt: serverTimestamp(),
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
                <button
                  key={group.id}
                  onClick={() => navigate(`/group/${group.id}`)}
                  className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-wc-green rounded-xl p-4 text-left transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{group.name}</div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        Código: <span className="text-wc-gold font-mono font-bold">{group.inviteCode}</span>
                        {group.adminIds?.includes(user.uid) && (
                          <span className="ml-2 text-wc-green">⭐ Admin</span>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-500 text-lg">›</div>
                  </div>
                </button>
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

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  collection, query, where, getDocs, addDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function JoinGroup() {
  const { user, handlePermissionError } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  // Si viene con ?code= en la URL, unirse automáticamente
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(urlCode.toUpperCase())
      joinGroup(urlCode.toUpperCase())
    }
  }, [])

  async function joinGroup(inviteCode) {
    const codeToUse = (inviteCode || code).toUpperCase().trim()
    if (!codeToUse) return

    setStatus('loading')
    setMessage('')

    try {
      // Buscar el grupo con este código
      const q = query(collection(db, 'groups'), where('inviteCode', '==', codeToUse))
      const snap = await getDocs(q)

      if (snap.empty) {
        setStatus('error')
        setMessage('Código de invitación inválido. Verifica con quien te lo envió.')
        return
      }

      const groupDoc = snap.docs[0]
      const groupId = groupDoc.id
      const groupData = groupDoc.data()

      // Verificar si ya es miembro
      const memberQ = query(
        collection(db, 'groupMembers'),
        where('groupId', '==', groupId),
        where('uid', '==', user.uid)
      )
      const memberSnap = await getDocs(memberQ)

      if (!memberSnap.empty) {
        setStatus('success')
        setMessage(`Ya eres miembro de "${groupData.name}". ¡Redirigiendo!`)
        setTimeout(() => navigate(`/group/${groupId}`), 1500)
        return
      }

      // Agregar como miembro
      await addDoc(collection(db, 'groupMembers'), {
        groupId,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        joinedAt: serverTimestamp(),
        paymentStatus: 'pending',
        receiptURL: null,
      })

      setStatus('success')
      setMessage(`¡Te uniste a "${groupData.name}"! Redirigiendo...`)
      setTimeout(() => navigate(`/group/${groupId}`), 1500)
    } catch (err) {
      console.error(err)
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handlePermissionError()
        return
      }
      setStatus('error')
      setMessage('Ocurrió un error. Intenta de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-wc-dark flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔗</div>
          <h1 className="text-2xl font-black text-white">Unirse a un Grupo</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa el código que te compartieron</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4">
          <input
            type="text"
            placeholder="Código de invitación (ej: ABC123)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinGroup()}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-wc-gold focus:outline-none text-sm font-mono tracking-widest text-center text-lg uppercase"
            maxLength={8}
            disabled={status === 'loading' || status === 'success'}
          />

          {status === 'loading' && (
            <div className="text-center text-gray-400 text-sm">🔍 Buscando grupo...</div>
          )}

          {status === 'error' && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm text-center">
              ❌ {message}
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 text-green-300 text-sm text-center">
              ✅ {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-gray-800"
            >
              ← Volver
            </button>
            <button
              onClick={() => joinGroup()}
              disabled={!code.trim() || status === 'loading' || status === 'success'}
              className="flex-1 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm hover:bg-yellow-400 disabled:opacity-50"
            >
              Unirse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

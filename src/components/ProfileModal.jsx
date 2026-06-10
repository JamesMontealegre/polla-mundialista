import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProfileModal({ onClose }) {
  const { user, userProfile, updateProfile } = useAuth()
  const [phone, setPhone] = useState(userProfile?.phoneNumber || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isValidPhone = /^3\d{9}$/.test(phone)

  async function handleSave() {
    if (!isValidPhone) {
      setError('Ingresa un celular colombiano valido (10 digitos, inicia con 3)')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateProfile({ phoneNumber: phone })
      onClose()
    } catch (err) {
      console.error(err)
      setError('Error guardando perfil. Intenta de nuevo.')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl border border-wc-green max-w-sm w-full p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-wc-gold font-black text-lg text-center mb-4">Mi Perfil</h2>

        {/* User info */}
        <div className="flex items-center gap-3 mb-5">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-14 h-14 rounded-full border-2 border-wc-gold" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-wc-green flex items-center justify-center text-white font-bold text-xl">
              {user.displayName?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate">{user.displayName}</div>
            <div className="text-gray-400 text-xs truncate">{user.email}</div>
          </div>
        </div>

        {/* Phone input */}
        <div className="space-y-2 mb-5">
          <label className="text-gray-300 text-sm font-semibold block">
            Celular (para recibir premios)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm font-mono">+57</span>
            <input
              type="tel"
              placeholder="3001234567"
              value={phone}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(v)
                setError('')
              }}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-wc-gold focus:outline-none text-sm font-mono tracking-wider"
              maxLength={10}
            />
          </div>
          {phone && !isValidPhone && (
            <p className="text-yellow-400 text-xs">Debe tener 10 digitos e iniciar con 3</p>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p className="text-gray-500 text-xs">
            Este numero se usara para consignar el premio si quedas en el podio.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidPhone || saving}
            className="flex-1 py-2.5 rounded-lg bg-wc-gold text-wc-dark font-bold text-sm disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

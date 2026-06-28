import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_WHATSAPP = '573219128803'

export default function ProfileModal({ onClose }) {
  const { user, userProfile, updateProfile, isAdmin } = useAuth()
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

        {/* WhatsApp contact (non-admin only) */}
        {!isAdmin && (
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hola%2C%20tengo%20una%20duda%20sobre%20la%20Polla%20Mundialista`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full mb-4 py-2.5 rounded-lg bg-green-700/20 border border-green-700 text-green-400 text-sm hover:bg-green-700/30 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            ¿Tienes dudas? Contacta al administrador
          </a>
        )}

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

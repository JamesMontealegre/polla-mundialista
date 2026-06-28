import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissionError, setPermissionError] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Llamar desde cualquier página cuando Firestore devuelve permission-denied
  const handlePermissionError = useCallback(() => {
    setPermissionError(true)
  }, [])

  const forceLogout = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (_) {
      // Ignorar errores de signOut
    }
    window.location.href = '/login'
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          // Cargar o crear perfil en Firestore
          const userRef = doc(db, 'users', firebaseUser.uid)
          const snap = await getDoc(userRef)
          if (!snap.exists()) {
            const profile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              phoneNumber: null,
              isAdmin: firebaseUser.uid === ADMIN_UID,
              createdAt: new Date().toISOString(),
            }
            await setDoc(userRef, profile)
            setUserProfile(profile)
          } else {
            const profile = snap.data()
            // Actualizar isAdmin por si cambió el ADMIN_UID
            const updated = { ...profile, isAdmin: firebaseUser.uid === ADMIN_UID }
            if (profile.isAdmin !== updated.isAdmin) {
              await setDoc(userRef, updated, { merge: true })
            }
            setUserProfile(updated)
          }
        } catch (error) {
          console.error('Error cargando perfil:', error)
          // Si falla Firestore, usar datos básicos del Auth para no bloquear el login
          setUserProfile({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            isAdmin: firebaseUser.uid === ADMIN_UID,
          })
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Listener de notificaciones no leídas
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    const q = query(
      collection(db, 'userNotifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    )
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size)
      // Badge en el icono de la app (Android Chrome PWA, desktop)
      if ('setAppBadge' in navigator) {
        if (snap.size > 0) {
          navigator.setAppBadge(snap.size).catch(() => {})
        } else {
          navigator.clearAppBadge().catch(() => {})
        }
      }
    }, (err) => {
      console.error('Error escuchando notificaciones:', err)
    })
    return unsub
  }, [user])

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  const logout = () => signOut(auth)

  const updateProfile = useCallback(async (updates) => {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    await setDoc(userRef, updates, { merge: true })
    setUserProfile(prev => ({ ...prev, ...updates }))
  }, [user])

  const isAdmin = userProfile?.isAdmin || false
  const profileComplete = !!userProfile?.phoneNumber

  // Pantalla de error de permisos (no hace auto-redirect para evitar loops)
  if (permissionError) {
    return (
      <div className="min-h-screen bg-wc-dark flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-gray-700">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error de permisos</h2>
          <p className="text-gray-400 mb-6">
            Tu sesión expiró o hubo un problema con los permisos de la base de datos.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-wc-green hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={forceLogout}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, loginWithGoogle, logout, isAdmin, profileComplete, updateProfile, handlePermissionError, unreadCount }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProfileModal from './ProfileModal'

export default function Navbar() {
  const { user, userProfile, logout, isAdmin, profileComplete } = useAuth()
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-wc-dark border-b border-wc-green shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <div>
            <span className="text-white font-black text-lg leading-none">POLLA</span>
            <span className="text-wc-gold font-black text-lg leading-none ml-1">MUNDIAL 26</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-wc-gold text-sm font-semibold hover:text-yellow-300 transition-colors hidden sm:block"
                >
                  ⚙️ Admin
                </Link>
              )}
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 relative hover:opacity-80 transition-opacity"
              >
                {user.photoURL && (
                  <div className="relative">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full border-2 border-wc-gold"
                    />
                    {!profileComplete && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-wc-dark" />
                    )}
                  </div>
                )}
                <span className="text-gray-300 text-sm hidden sm:block truncate max-w-[120px]">
                  {user.displayName?.split(' ')[0]}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </nav>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, UserCircle, LogIn, UserPlus } from 'lucide-react'

export default function Header() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Error signing out:', error)
    } else {
      navigate('/')
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              면접하자
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-4 animate-pulse">
                <div className="w-32 h-8 bg-gray-200 rounded-md"></div>
                <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
              </div>
            ) : user ? (
              <>
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                </Link>
                <Link
                  to="/signup"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>회원가입</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

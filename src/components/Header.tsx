import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, UserCircle } from 'lucide-react'

export default function Header() {
  const { user, signOut, loading, isAdmin } = useAuth()
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
          <div className="flex items-center gap-6">
            {loading ? (
              <div className="flex items-center gap-4 animate-pulse">
                <div className="w-32 h-8 bg-gray-200 rounded-md"></div>
                <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
              </div>
            ) : user ? (
              <>
                {isAdmin ? (
                  <Link to="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    관리자 페이지
                  </Link>
                ) : (
                  <>
                    <Link to="/profile" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                      프로필 설정
                    </Link>
                    <Link to="/setup" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                      면접 설정
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

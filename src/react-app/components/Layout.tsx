import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Home, FileText, Heart, Clock, Settings, LogOut, CheckSquare, Timer } from 'lucide-react';
import { useTheme } from '@/react-app/contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Вопросы', href: '/questions', icon: FileText },
    { name: 'Практики', href: '/practices', icon: Heart },
    { name: 'История', href: '/timeline', icon: Clock },
    { name: 'Задачи', href: '/todos', icon: CheckSquare },
    { name: 'Помодоро', href: '/pomodoro', icon: Timer },
    { name: 'Настройки', href: '/settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-sm border-b sticky top-0 z-50 transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-blue-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>AI Diary</span>
            </Link>
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {user.google_user_data.given_name || user.email}
                </span>
                <button
                  onClick={logout}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        {user && (
          <nav className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 backdrop-blur-sm border-r p-4 transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800/60 border-gray-700' 
              : 'bg-white/60 border-blue-100'
          }`}>
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-400/10 to-purple-500/10 text-blue-600 shadow-sm'
                        : isDark
                          ? 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-400'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive 
                        ? 'text-blue-600' 
                        : isDark 
                          ? 'text-gray-400' 
                          : 'text-gray-400'
                    }`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${user ? 'ml-64' : ''} min-h-[calc(100vh-4rem)]`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

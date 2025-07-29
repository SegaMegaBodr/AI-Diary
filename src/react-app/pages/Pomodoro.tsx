import { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/contexts/AuthContext';
import { ArrowLeft, Play, Pause, RotateCcw, Timer, CheckSquare, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import Layout from '@/react-app/components/Layout';
import { useTheme } from '@/react-app/contexts/ThemeContext';
import type { PomodoroSession, CreatePomodoroSessionRequest, Todo } from '@/shared/types';

type SessionType = 'work' | 'short_break' | 'long_break';

export default function Pomodoro() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [customDuration, setCustomDuration] = useState({
    work: 25,
    short_break: 5,
    long_break: 15
  });
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const sessionConfigs = {
    work: { duration: customDuration.work, label: 'Работа', color: 'from-red-500 to-orange-500' },
    short_break: { duration: customDuration.short_break, label: 'Короткий перерыв', color: 'from-green-500 to-teal-500' },
    long_break: { duration: customDuration.long_break, label: 'Длинный перерыв', color: 'from-blue-500 to-purple-500' },
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [sessionsResponse, todosResponse] = await Promise.all([
          fetch('/api/pomodoro-sessions'),
          fetch('/api/todos')
        ]);
        
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setSessions(sessionsData);
        }
        
        if (todosResponse.ok) {
          const todosData = await todosResponse.json();
          setTodos(todosData.filter((todo: Todo) => !todo.is_completed));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Check if we came from the todos page with a selected task
    if (location.state?.selectedTask) {
      setSelectedTask(location.state.selectedTask);
    }
  }, [user, location.state]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Пожалуйста, войдите в систему</p>
        </div>
      </Layout>
    );
  }

  const handleSessionComplete = async () => {
    setIsActive(false);
    setIsPaused(false);

    try {
      const sessionData: CreatePomodoroSessionRequest = {
        type: sessionType,
        duration_minutes: sessionConfigs[sessionType].duration,
        task_id: sessionType === 'work' && selectedTask ? selectedTask.id! : null,
      };

      const response = await fetch('/api/pomodoro-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        
        if (sessionType === 'work') {
          setCompletedSessions(prev => prev + 1);
        }

        // Auto-switch to break after work session
        if (sessionType === 'work') {
          const nextType = completedSessions % 4 === 3 ? 'long_break' : 'short_break';
          setSessionType(nextType);
          const newConfig = {
            ...sessionConfigs,
            [nextType]: { ...sessionConfigs[nextType], duration: customDuration[nextType] }
          };
          setTimeLeft(newConfig[nextType].duration * 60);
        } else {
          setSessionType('work');
          setTimeLeft(customDuration.work * 60);
        }
      }
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
    }
  };

  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(customDuration[sessionType] * 60);
  };

  const switchSessionType = (type: SessionType) => {
    setSessionType(type);
    setTimeLeft(customDuration[type] * 60);
    setIsActive(false);
    setIsPaused(false);
  };

  const updateCustomDuration = (type: SessionType, minutes: number) => {
    setCustomDuration(prev => ({ ...prev, [type]: minutes }));
    if (sessionType === type && !isActive) {
      setTimeLeft(minutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((customDuration[sessionType] * 60 - timeLeft) / (customDuration[sessionType] * 60)) * 100;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Помодоро Трекер
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Управляйте временем эффективно
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-sm border mb-8 ${
            isDark 
              ? 'bg-gray-800/70 border-gray-700/50' 
              : 'bg-white/70 border-blue-100/50'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Настройки времени
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(customDuration).map(([type, duration]) => (
                <div key={type}>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {type === 'work' ? 'Работа' : 
                     type === 'short_break' ? 'Короткий перерыв' : 'Длинный перерыв'} (мин)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={duration}
                    onChange={(e) => updateCustomDuration(type as SessionType, parseInt(e.target.value) || 1)}
                    className={`w-full p-3 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600 text-white' 
                        : 'bg-blue-50/50 border-blue-200/50 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Selection */}
        {sessionType === 'work' && todos.length > 0 && (
          <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-sm border mb-8 ${
            isDark 
              ? 'bg-gray-800/70 border-gray-700/50' 
              : 'bg-white/70 border-blue-100/50'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Выберите задачу
            </h2>
            
            <div className="grid gap-2">
              <button
                onClick={() => setSelectedTask(null)}
                className={`p-3 rounded-xl text-left transition-all ${
                  !selectedTask
                    ? isDark
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                      : 'bg-blue-100/70 border border-blue-200 text-blue-700'
                    : isDark
                      ? 'bg-gray-700/30 border border-transparent text-gray-300 hover:bg-gray-700/50'
                      : 'bg-gray-50/70 border border-transparent text-gray-700 hover:bg-gray-100/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Timer className="w-4 h-4" />
                  <span>Без привязки к задаче</span>
                </div>
              </button>
              
              {todos.slice(0, 5).map((todo) => (
                <button
                  key={todo.id}
                  onClick={() => setSelectedTask(todo)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedTask?.id === todo.id
                      ? isDark
                        ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                        : 'bg-blue-100/70 border border-blue-200 text-blue-700'
                      : isDark
                        ? 'bg-gray-700/30 border border-transparent text-gray-300 hover:bg-gray-700/50'
                        : 'bg-gray-50/70 border border-transparent text-gray-700 hover:bg-gray-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckSquare className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{todo.title}</div>
                      {todo.estimated_pomodoros > 1 && (
                        <div className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.completed_pomodoros}/{todo.estimated_pomodoros} помодоро
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {todos.length > 5 && (
                <Link
                  to="/todos"
                  className={`p-3 rounded-xl text-center transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/70'
                  }`}
                >
                  Посмотреть все задачи ({todos.length})
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Timer Section */}
        <div className={`backdrop-blur-sm rounded-2xl p-8 shadow-sm border mb-8 ${
          isDark 
            ? 'bg-gray-800/70 border-gray-700/50' 
            : 'bg-white/70 border-blue-100/50'
        }`}>
          {/* Session Type Selector */}
          <div className="flex justify-center mb-8">
            <div className={`flex rounded-xl p-1 ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {Object.entries(sessionConfigs).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => switchSessionType(type as SessionType)}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${
                    sessionType === type
                      ? `bg-gradient-to-r ${config.color} text-white shadow-sm`
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Task Display */}
          {sessionType === 'work' && selectedTask && (
            <div className={`text-center mb-6 p-4 rounded-xl ${
              isDark ? 'bg-gray-700/50' : 'bg-blue-50/50'
            }`}>
              <div className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Работаем над задачей:
              </div>
              <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedTask.title}
              </div>
              {selectedTask.estimated_pomodoros > 1 && (
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Помодоро: {selectedTask.completed_pomodoros}/{selectedTask.estimated_pomodoros}
                </div>
              )}
            </div>
          )}

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className="relative w-64 h-64 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className={`transition-all duration-1000 ${
                    sessionType === 'work' ? 'text-red-500' :
                    sessionType === 'short_break' ? 'text-green-500' :
                    'text-blue-500'
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {sessionConfigs[sessionType].label}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isActive ? (
                <button
                  onClick={startTimer}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <Play className="w-5 h-5" />
                  <span>Начать</span>
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center space-x-2 px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all duration-200 font-medium"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  <span>{isPaused ? 'Продолжить' : 'Пауза'}</span>
                </button>
              )}
              
              <button
                onClick={resetTimer}
                className="flex items-center space-x-2 px-6 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 font-medium"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Сброс</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {completedSessions}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Сессий сегодня
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {sessions.length}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Всего сессий
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-sm border ${
          isDark 
            ? 'bg-gray-800/70 border-gray-700/50' 
            : 'bg-white/70 border-blue-100/50'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Последние сессии
          </h2>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Timer className={`w-12 h-12 mx-auto mb-3 ${
                isDark ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Пока нет завершенных сессий
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => {
                const linkedTodo = session.task_id ? todos.find(t => t.id === session.task_id) : null;
                return (
                  <div key={session.id} className={`flex items-center justify-between p-3 rounded-xl ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-50/50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        session.type === 'work' ? 'bg-red-500' :
                        session.type === 'short_break' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {sessionConfigs[session.type as SessionType].label}
                        </span>
                        {linkedTodo && (
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {linkedTodo.title}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {session.duration_minutes} мин • {new Date(session.completed_at!).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

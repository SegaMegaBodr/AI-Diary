import { useState, useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { 
  ArrowLeft, Plus, CheckCircle2, Circle, Trash2, Edit3, 
  Calendar, Flag, Clock, Star, Sun, Timer,
  ChevronRight, Menu, X, Search
} from 'lucide-react';
import { Link } from 'react-router';
import Layout from '@/react-app/components/Layout';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '@/shared/types';
import { useTheme } from '@/react-app/contexts/ThemeContext';

type ViewFilter = 'all' | 'today' | 'important' | 'planned' | 'completed';

export default function Todos() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [activeFilter, setActiveFilter] = useState<ViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [lists, setLists] = useState<string[]>(['My Tasks', 'Work', 'Personal']);
  const [activeList, setActiveList] = useState('My Tasks');

  const [newTodo, setNewTodo] = useState<CreateTodoRequest>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: null,
    notes: '',
    list_name: 'My Tasks',
    reminder_date: null,
    estimated_pomodoros: 1,
  });

  useEffect(() => {
    if (!user) return;

    const fetchTodos = async () => {
      try {
        const response = await fetch('/api/todos');
        if (response.ok) {
          const todosData = await response.json();
          setTodos(todosData);
          
          // Extract unique list names
          const uniqueLists = [...new Set(todosData.map((todo: Todo) => todo.list_name).filter(Boolean))];
          setLists(prev => [...new Set([...prev, ...uniqueLists])].filter((item): item is string => typeof item === 'string'));
        }
      } catch (error) {
        console.error('Error fetching todos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Пожалуйста, войдите в систему</p>
        </div>
      </Layout>
    );
  }

  const handleCreateTodo = async () => {
    if (!newTodo.title.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTodo,
          list_name: activeList,
        }),
      });

      if (response.ok) {
        const createdTodo = await response.json();
        setTodos(prev => [createdTodo, ...prev]);
        setNewTodo({
          title: '',
          description: '',
          priority: 'medium',
          due_date: null,
          notes: '',
          list_name: activeList,
          reminder_date: null,
          estimated_pomodoros: 1,
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleUpdateTodo = async (id: number, updates: UpdateTodoRequest) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo));
        if (selectedTodo?.id === id) {
          setSelectedTodo(updatedTodo);
        }
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm('Удалить эту задачу?')) return;
    
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTodos(prev => prev.filter(todo => todo.id !== id));
        if (selectedTodo?.id === id) {
          setSelectedTodo(null);
        }
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const toggleComplete = (todo: Todo) => {
    handleUpdateTodo(todo.id!, { is_completed: !todo.is_completed });
  };

  const markImportant = (todo: Todo) => {
    const newPriority = todo.priority === 'high' ? 'medium' : 'high';
    handleUpdateTodo(todo.id!, { priority: newPriority });
  };

  const getFilteredTodos = () => {
    let filtered = todos.filter(todo => 
      (!activeList || todo.list_name === activeList) &&
      (searchQuery === '' || 
       todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       todo.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    switch (activeFilter) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(todo => 
          todo.due_date === today || 
          todo.reminder_date?.startsWith(today)
        );
        break;
      case 'important':
        filtered = filtered.filter(todo => todo.priority === 'high');
        break;
      case 'planned':
        filtered = filtered.filter(todo => todo.due_date || todo.reminder_date);
        break;
      case 'completed':
        filtered = filtered.filter(todo => todo.is_completed);
        break;
      default:
        filtered = filtered.filter(todo => !todo.is_completed);
    }

    return filtered.sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const getTaskCounts = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      all: todos.filter(t => !t.is_completed).length,
      today: todos.filter(t => 
        !t.is_completed && (t.due_date === today || t.reminder_date?.startsWith(today))
      ).length,
      important: todos.filter(t => !t.is_completed && t.priority === 'high').length,
      planned: todos.filter(t => !t.is_completed && (t.due_date || t.reminder_date)).length,
      completed: todos.filter(t => t.is_completed).length,
    };
  };

  const counts = getTaskCounts();
  const filteredTodos = getFilteredTodos();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin">
            <CheckCircle2 className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-7rem)]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r ${
            isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
          } backdrop-blur-sm`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
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
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  To Do
                </h1>
                <button
                  onClick={() => setShowSidebar(false)}
                  className={`p-2 rounded-lg transition-colors lg:hidden ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Поиск задач..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' 
                        : 'bg-blue-50/50 border-blue-200/50 text-gray-900 placeholder-gray-500 focus:border-blue-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-1 mb-6">
                {[
                  { key: 'all', label: 'Все задачи', icon: Sun, count: counts.all },
                  { key: 'today', label: 'Сегодня', icon: Calendar, count: counts.today },
                  { key: 'important', label: 'Важные', icon: Star, count: counts.important },
                  { key: 'planned', label: 'Запланированные', icon: Clock, count: counts.planned },
                  { key: 'completed', label: 'Выполненные', icon: CheckCircle2, count: counts.completed },
                ].map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key as ViewFilter)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      activeFilter === key
                        ? isDark
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-blue-100 text-blue-700'
                        : isDark
                          ? 'text-gray-300 hover:bg-gray-700/50'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{label}</span>
                    </div>
                    {count > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Lists */}
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Списки
                </h3>
                <div className="space-y-1">
                  {lists.map((list) => (
                    <button
                      key={list}
                      onClick={() => setActiveList(list)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        activeList === list
                          ? isDark
                            ? 'bg-purple-600/20 text-purple-400'
                            : 'bg-purple-100 text-purple-700'
                          : isDark
                            ? 'text-gray-300 hover:bg-gray-700/50'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium">{list}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {todos.filter(t => t.list_name === list && !t.is_completed).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Task List */}
            <div className={`flex-1 ${selectedTodo ? 'hidden lg:block' : ''}`}>
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className={`p-4 border-b ${
                  isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white/30'
                } backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {!showSidebar && (
                        <button
                          onClick={() => setShowSidebar(true)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Menu className="w-5 h-5" />
                        </button>
                      )}
                      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {activeFilter === 'all' ? activeList : 
                         activeFilter === 'today' ? 'Сегодня' :
                         activeFilter === 'important' ? 'Важные' :
                         activeFilter === 'planned' ? 'Запланированные' :
                         activeFilter === 'completed' ? 'Выполненные' : activeList
                        }
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Добавить задачу</span>
                    </button>
                  </div>
                </div>

                {/* Add Task Form */}
                {showAddForm && (
                  <div className={`p-4 border-b ${
                    isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-blue-50/50'
                  }`}>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Добавить задачу"
                        value={newTodo.title}
                        onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white/70 border-blue-200/50 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent`}
                        autoFocus
                      />
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCreateTodo}
                          disabled={!newTodo.title.trim()}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Добавить
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            isDark 
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task List */}
                <div className="flex-1 overflow-auto">
                  {filteredTodos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <CheckCircle2 className={`w-16 h-16 mb-4 ${
                        isDark ? 'text-gray-600' : 'text-gray-300'
                      }`} />
                      <h3 className={`text-xl font-semibold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {searchQuery ? 'Ничего не найдено' : 'Нет задач'}
                      </h3>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте первую задачу, чтобы начать'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredTodos.map((todo) => (
                        <div
                          key={todo.id}
                          onClick={() => setSelectedTodo(todo)}
                          className={`group flex items-center space-x-3 p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                            selectedTodo?.id === todo.id
                              ? isDark
                                ? 'bg-blue-600/20 border border-blue-500/30'
                                : 'bg-blue-100/70 border border-blue-200'
                              : isDark
                                ? 'hover:bg-gray-700/30 border border-transparent'
                                : 'hover:bg-gray-50/70 border border-transparent'
                          } ${todo.is_completed ? 'opacity-60' : ''}`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComplete(todo);
                            }}
                            className={`flex-shrink-0 transition-colors ${
                              todo.is_completed ? 'text-green-500' : 'text-blue-500 hover:text-blue-600'
                            }`}
                          >
                            {todo.is_completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className={`font-medium truncate ${
                                todo.is_completed
                                  ? isDark ? 'text-gray-500 line-through' : 'text-gray-500 line-through'
                                  : isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {todo.title}
                              </h3>
                              {todo.priority === 'high' && (
                                <Star className="w-4 h-4 text-red-500 fill-current" />
                              )}
                            </div>
                            
                            {(todo.description || todo.due_date || todo.reminder_date) && (
                              <div className={`text-xs mt-1 truncate ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {todo.description && <span>{todo.description}</span>}
                                {todo.due_date && (
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(todo.due_date)}</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {todo.estimated_pomodoros > 1 && (
                              <div className={`text-xs mt-1 flex items-center space-x-1 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <Timer className="w-3 h-3" />
                                <span>{todo.completed_pomodoros}/{todo.estimated_pomodoros} помодоро</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markImportant(todo);
                            }}
                            className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                              todo.priority === 'high' ? 'opacity-100 text-red-500' : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${todo.priority === 'high' ? 'fill-current' : ''}`} />
                          </button>

                          <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Detail Panel */}
            {selectedTodo && (
              <div className={`w-full lg:w-96 border-l ${
                isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
              } backdrop-blur-sm`}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedTodo(null)}
                        className={`p-2 rounded-lg transition-colors lg:hidden ${
                          isDark 
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => console.log('Edit functionality can be added')}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark 
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(selectedTodo.id!)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark 
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                              : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {/* Title and Completion */}
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleComplete(selectedTodo)}
                        className={`flex-shrink-0 mt-1 transition-colors ${
                          selectedTodo.is_completed ? 'text-green-500' : 'text-blue-500 hover:text-blue-600'
                        }`}
                      >
                        {selectedTodo.is_completed ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>
                      <h2 className={`text-xl font-semibold ${
                        selectedTodo.is_completed
                          ? isDark ? 'text-gray-500 line-through' : 'text-gray-500 line-through'
                          : isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {selectedTodo.title}
                      </h2>
                    </div>

                    {/* Description */}
                    {selectedTodo.description && (
                      <div>
                        <h3 className={`text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Описание
                        </h3>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {selectedTodo.description}
                        </p>
                      </div>
                    )}

                    {/* Due Date */}
                    {selectedTodo.due_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Срок: {formatDate(selectedTodo.due_date)}
                        </span>
                      </div>
                    )}

                    {/* Reminder */}
                    {selectedTodo.reminder_date && (
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Напоминание: {new Date(selectedTodo.reminder_date).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    )}

                    {/* Priority */}
                    <div className="flex items-center space-x-2">
                      <Flag className={`w-4 h-4 ${getPriorityColor(selectedTodo.priority)}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Приоритет: {selectedTodo.priority === 'high' ? 'Высокий' : 
                                   selectedTodo.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                    </div>

                    {/* Pomodoros */}
                    {selectedTodo.estimated_pomodoros > 1 && (
                      <div className="flex items-center space-x-2">
                        <Timer className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Помодоро: {selectedTodo.completed_pomodoros}/{selectedTodo.estimated_pomodoros}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedTodo.notes && (
                      <div>
                        <h3 className={`text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Заметки
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedTodo.notes}
                        </p>
                      </div>
                    )}

                    {/* List */}
                    <div className="flex items-center space-x-2">
                      <Menu className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Список: {selectedTodo.list_name}
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 space-y-2">
                      <Link
                        to="/pomodoro"
                        state={{ selectedTask: selectedTodo }}
                        className="flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200"
                      >
                        <Timer className="w-4 h-4" />
                        <span>Запустить помодоро</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

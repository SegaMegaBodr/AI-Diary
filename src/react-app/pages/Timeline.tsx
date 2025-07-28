import { useState, useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { ArrowLeft, Calendar, Sun, Moon, Filter, Heart, Search, Edit3, Trash2, Download } from 'lucide-react';
import { Link } from 'react-router';
import Layout from '@/react-app/components/Layout';
import type { Answer, Practice, UpdateAnswerRequest } from '@/shared/types';

export default function Timeline() {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'morning' | 'evening'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
  const [editForm, setEditForm] = useState({ question_1: '', question_2: '', question_3: '' });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const searchParams = new URLSearchParams();
        if (searchQuery) searchParams.append('search', searchQuery);
        
        const [answersResponse, practicesResponse] = await Promise.all([
          fetch(`/api/answers?${searchParams}`),
          fetch('/api/practices'),
        ]);

        if (answersResponse.ok) {
          const answersData = await answersResponse.json();
          setAnswers(answersData);
        }

        if (practicesResponse.ok) {
          const practicesData = await practicesResponse.json();
          setPractices(practicesData);
        }
      } catch (error) {
        console.error('Error fetching timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, searchQuery]);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-gray-400">Пожалуйста, войдите в систему</p>
        </div>
      </Layout>
    );
  }

  const handleUpdateAnswer = async (id: number, updates: UpdateAnswerRequest) => {
    try {
      const response = await fetch(`/api/answers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedAnswer = await response.json();
        setAnswers(prev => prev.map(answer => answer.id === id ? updatedAnswer : answer));
        setEditingAnswer(null);
      }
    } catch (error) {
      console.error('Error updating answer:', error);
    }
  };

  const handleDeleteAnswer = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

    try {
      const response = await fetch(`/api/answers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAnswers(prev => prev.filter(answer => answer.id !== id));
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
    }
  };

  const handleDeletePractice = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту практику?')) return;

    try {
      const response = await fetch(`/api/practices/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPractices(prev => prev.filter(practice => practice.id !== id));
      }
    } catch (error) {
      console.error('Error deleting practice:', error);
    }
  };

  const exportData = () => {
    const data = {
      answers: filteredAnswers,
      practices: practices,
      exported_at: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-diary-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin">
            <Heart className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </Layout>
    );
  }

  const filteredAnswers = answers.filter(answer => 
    filterType === 'all' || answer.type === filterType
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPracticeTitle = (type: string) => {
    switch (type) {
      case 'breathing_478':
        return 'Дыхание 4-7-8';
      case 'square_breathing':
        return 'Квадратное дыхание';
      case 'calm_breathing':
        return 'Спокойное дыхание';
      default:
        return type;
    }
  };

  const getQuestionTitle = (type: string, index: number) => {
    if (type === 'morning') {
      return ['За что я благодарен сегодня?', 'Что меня радует или вдохновляет?', 'Кому или как я могу помочь сегодня?'][index];
    } else {
      return ['Что хорошего произошло сегодня?', 'Чему я научился?', 'Как я могу сделать завтра лучше?'][index];
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">История записей</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Ваш путь саморазвития и осознанности</p>
            </div>
          </div>

          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по записям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-blue-100/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div className="flex bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-1 border border-blue-100 dark:border-gray-700">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Все записи
              </button>
              <button
                onClick={() => setFilterType('morning')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  filterType === 'morning'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Утро</span>
              </button>
              <button
                onClick={() => setFilterType('evening')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  filterType === 'evening'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Вечер</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {filteredAnswers.length === 0 && practices.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Пока нет записей</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Начните свой путь осознанности с первых вопросов</p>
              <Link
                to="/questions"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium"
              >
                <span>Ответить на вопросы</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Answers */}
              {filteredAnswers.map((answer) => (
                <div
                  key={answer.id}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        answer.type === 'morning' 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600'
                      }`}>
                        {answer.type === 'morning' ? (
                          <Sun className="w-5 h-5 text-white" />
                        ) : (
                          <Moon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {answer.type === 'morning' ? 'Утренние вопросы' : 'Вечерние вопросы'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(answer.created_at!)} в {formatTime(answer.created_at!)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingAnswer(answer);
                          setEditForm({
                            question_1: answer.question_1 || '',
                            question_2: answer.question_2 || '',
                            question_3: answer.question_3 || ''
                          });
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnswer(answer.id!)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {editingAnswer?.id === answer.id ? (
                    <div className="space-y-4">
                      {[0, 1, 2].map((index) => (
                        <div key={index}>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getQuestionTitle(answer.type, index)}
                          </p>
                          <textarea
                            value={editForm[`question_${index + 1}` as keyof typeof editForm]}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              [`question_${index + 1}`]: e.target.value
                            }))}
                            className="w-full p-3 bg-blue-50/50 dark:bg-gray-700/50 border border-blue-200/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                            rows={3}
                          />
                        </div>
                      ))}
                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={() => handleUpdateAnswer(answer.id!, editForm)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => setEditingAnswer(null)}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 font-medium"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[answer.question_1, answer.question_2, answer.question_3].map((answerText, index) => (
                        answerText && (
                          <div key={index} className="border-l-4 border-blue-200 dark:border-blue-600 pl-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {getQuestionTitle(answer.type, index)}
                            </p>
                            <p className="text-gray-900 dark:text-white">{answerText}</p>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Practices */}
              {practices.map((practice) => (
                <div
                  key={practice.id}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-green-100/50 dark:border-green-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getPracticeTitle(practice.type)}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(practice.completed_at!)} в {formatTime(practice.completed_at!)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {Math.floor(practice.duration_seconds / 60)}:{(practice.duration_seconds % 60).toString().padStart(2, '0')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">длительность</p>
                      </div>
                      <button
                        onClick={() => handleDeletePractice(practice.id!)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

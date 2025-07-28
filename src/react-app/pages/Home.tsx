import { useAuth } from '@getmocha/users-service/react';
import { Heart, ArrowRight, Sparkles, CheckSquare, Timer } from 'lucide-react';
import Layout from '@/react-app/components/Layout';

export default function Home() {
  const { user, redirectToLogin, isPending } = useAuth();

  if (isPending) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin">
            <Heart className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              AI Diary
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Ваш персональный дневник благодарности и саморефлексии. 
              Исследуйте свой внутренний мир с помощью утренних и вечерних практик осознанности.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Утренние вопросы</h3>
              <p className="text-gray-600">Начните день с благодарности и позитивных намерений</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Дыхательные практики</h3>
              <p className="text-gray-600">Успокойте ум с помощью осознанного дыхания</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Вечерняя рефлексия</h3>
              <p className="text-gray-600">Завершите день осмыслением и планированием</p>
            </div>
          </div>

          <button
            onClick={redirectToLogin}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            <span>Войти через Google</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </Layout>
    );
  }

  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 18;
  const greeting = currentHour < 12 ? 'Доброе утро' : currentHour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {greeting}, {user.google_user_data.given_name || 'друг'}!
          </h1>
          <p className="text-gray-600">
            {isEvening 
              ? 'Время для вечерней рефлексии и подведения итогов дня'
              : 'Начните день с благодарности и позитивных намерений'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <a
            href="/questions"
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-100/50 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isEvening ? 'Вечерние вопросы' : 'Утренние вопросы'}
            </h2>
            <p className="text-gray-600">
              {isEvening 
                ? 'Подведите итоги дня и настройтесь на завтра'
                : 'За что вы благодарны? Что вас вдохновляет?'
              }
            </p>
          </a>

          <a
            href="/practices"
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-100/50 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Дыхательные практики</h2>
            <p className="text-gray-600">Успокойте ум и найдите внутренний баланс</p>
          </a>

          <a
            href="/timeline"  
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-100/50 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">История записей</h2>
            <p className="text-gray-600">Просмотрите свой путь саморазвития</p>
          </a>

          <a
            href="/todos"
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-100/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Задачи</h2>
            <p className="text-gray-600 dark:text-gray-400">Организуйте свои дела и цели</p>
          </a>

          <a
            href="/pomodoro"
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-100/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-xl flex items-center justify-center">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Помодоро Трекер</h2>
            <p className="text-gray-600 dark:text-gray-400">Управляйте временем эффективно</p>
          </a>

          <a
            href="/settings"
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-blue-100/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-500 transition-colors" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Настройки</h2>
            <p className="text-gray-600 dark:text-gray-400">Настройте уведомления и тему оформления</p>
          </a>
        </div>
      </div>
    </Layout>
  );
}

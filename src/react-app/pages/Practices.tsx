import { useAuth } from '@getmocha/users-service/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import Layout from '@/react-app/components/Layout';
import PracticeCard from '@/react-app/components/PracticeCard';
import type { CreatePracticeRequest } from '@/shared/types';

export default function Practices() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600">Пожалуйста, войдите в систему</p>
        </div>
      </Layout>
    );
  }

  const handlePracticeComplete = async (type: string, duration: number) => {
    try {
      const requestData: CreatePracticeRequest = {
        type: type as 'breathing_478' | 'square_breathing' | 'calm_breathing',
        duration_seconds: duration,
      };

      const response = await fetch('/api/practices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to save practice');
      }

      // Show success message
      alert(`Практика завершена! Время: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('Error saving practice:', error);
      alert('Произошла ошибка при сохранении практики');
    }
  };

  const practices = [
    {
      title: 'Дыхание 4-7-8',
      description: 'Успокаивающая техника: вдох на 4, задержка на 7, выдох на 8 счетов',
      type: 'breathing_478' as const,
    },
    {
      title: 'Квадратное дыхание',
      description: 'Равномерное дыхание: вдох, задержка, выдох, пауза по 4 счета',
      type: 'square_breathing' as const,
    },
    {
      title: 'Спокойное дыхание',
      description: 'Простая техника релаксации: вдох на 4, выдох на 6 счетов',
      type: 'calm_breathing' as const,
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Link
            to="/"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Дыхательные практики</h1>
            <p className="text-gray-600 mt-2">Найдите спокойствие и баланс через осознанное дыхание</p>
          </div>
        </div>

        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6">
          {practices.map((practice) => (
            <PracticeCard
              key={practice.type}
              title={practice.title}
              description={practice.description}
              type={practice.type}
              onComplete={handlePracticeComplete}
            />
          ))}
        </div>

        <div className="mt-12 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Советы для практики</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Найдите тихое место, где вас не будут беспокоить</li>
            <li>• Сядьте удобно с прямой спиной или лягте</li>
            <li>• Дышите через нос, если это возможно</li>
            <li>• Не напрягайтесь, если сбились с ритма - просто начните заново</li>
            <li>• Регулярная практика принесет лучшие результаты</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { Sun, Moon, Send, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import Layout from '@/react-app/components/Layout';
import QuestionCard from '@/react-app/components/QuestionCard';
import type { CreateAnswerRequest } from '@/shared/types';

export default function Questions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<'morning' | 'evening'>(() => {
    const hour = new Date().getHours();
    return hour < 18 ? 'morning' : 'evening';
  });
  const [answers, setAnswers] = useState({
    question_1: '',
    question_2: '',
    question_3: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600">Пожалуйста, войдите в систему</p>
        </div>
      </Layout>
    );
  }

  const morningQuestions = [
    'За что я благодарен сегодня?',
    'Что меня радует или вдохновляет?',
    'Кому или как я могу помочь сегодня?',
  ];

  const eveningQuestions = [
    'Что хорошего произошло сегодня?',
    'Чему я научился?',
    'Как я могу сделать завтра лучше?',
  ];

  const questions = type === 'morning' ? morningQuestions : eveningQuestions;

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`question_${index + 1}`]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!answers.question_1 || !answers.question_2 || !answers.question_3) {
      alert('Пожалуйста, ответьте на все вопросы');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData: CreateAnswerRequest = {
        type,
        question_1: answers.question_1,
        question_2: answers.question_2,
        question_3: answers.question_3,
      };

      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to save answers');
      }

      // Reset form
      setAnswers({
        question_1: '',
        question_2: '',
        question_3: '',
      });

      // Show success message and redirect
      alert('Ваши ответы сохранены!');
      navigate('/');
    } catch (error) {
      console.error('Error saving answers:', error);
      alert('Произошла ошибка при сохранении ответов');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {type === 'morning' ? 'Утренние вопросы' : 'Вечерние вопросы'}
            </h1>
          </div>

          <div className="flex bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-blue-100">
            <button
              onClick={() => setType('morning')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                type === 'morning'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Утро</span>
            </button>
            <button
              onClick={() => setType('evening')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                type === 'evening'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Вечер</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <QuestionCard
              key={`${type}-${index}`}
              question={question}
              value={answers[`question_${index + 1}` as keyof typeof answers]}
              onChange={(value) => handleAnswerChange(index, value)}
              placeholder="Поделитесь своими мыслями..."
            />
          ))}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? 'Сохранение...' : 'Сохранить ответы'}</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

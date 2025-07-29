import { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/contexts/AuthContext';
import { ArrowLeft, Clock, Palette, Save } from 'lucide-react';
import { Link } from 'react-router';
import Layout from '@/react-app/components/Layout';
import { useTheme } from '@/react-app/contexts/ThemeContext';
import type { UserSettings, UpdateSettingsRequest } from '@/shared/types';

export default function Settings() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settingsData = await response.json();
          setSettings(settingsData);
          // Apply theme from settings
          if (settingsData.theme) {
            setTheme(settingsData.theme);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-gray-400">Пожалуйста, войдите в систему</p>
        </div>
      </Layout>
    );
  }

  if (isLoading || !settings) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin">
            <Clock className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </Layout>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateSettingsRequest = {
        morning_notification_time: settings.morning_notification_time,
        evening_notification_time: settings.evening_notification_time,
        theme: settings.theme,
      };

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      // Apply theme immediately
      if (updatedSettings.theme) {
        setTheme(updatedSettings.theme);
      }
      alert('Настройки сохранены!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Произошла ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
            <p className="text-gray-600 mt-2">Персонализируйте свой опыт использования AI Diary</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Уведомления</h2>
                <p className="text-gray-600">Настройте время для напоминаний о практиках</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Утреннее напоминание
                </label>
                <input
                  type="time"
                  value={settings.morning_notification_time || '08:00'}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    morning_notification_time: e.target.value
                  } : null)}
                  className="w-full p-3 bg-blue-50/50 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вечернее напоминание
                </label>
                <input
                  type="time"
                  value={settings.evening_notification_time || '20:00'}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    evening_notification_time: e.target.value
                  } : null)}
                  className="w-full p-3 bg-blue-50/50 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Тема оформления</h2>
                <p className="text-gray-600">Выберите предпочитаемую цветовую схему</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setSettings(prev => prev ? { ...prev, theme: 'light' } : null)}
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  settings.theme === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-white rounded-lg mx-auto mb-2 border border-gray-200"></div>
                <p className="font-medium">Светлая</p>
                <p className="text-sm opacity-75">Классическая светлая тема</p>
              </button>

              <button
                onClick={() => setSettings(prev => prev ? { ...prev, theme: 'dark' } : null)}
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mx-auto mb-2"></div>
                <p className="font-medium">Темная</p>
                <p className="text-sm opacity-75">Комфортная для глаз</p>
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100/50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация профиля</h2>
            <div className="flex items-center space-x-4">
              {user.notion_user_data?.avatar_url && (
                <img
                  src={user.notion_user_data.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-2 border-blue-200"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {user.notion_user_data?.name || 'Пользователь'}
                </p>
                {user.notion_user_data?.person?.email && (
                  <p className="text-gray-600">{user.notion_user_data.person.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Сохранение...' : 'Сохранить настройки'}</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

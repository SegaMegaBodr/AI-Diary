import { useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PracticeCardProps {
  title: string;
  description: string;
  type: 'breathing_478' | 'square_breathing' | 'calm_breathing';
  onComplete: (type: string, duration: number) => void;
}

export default function PracticeCard({ title, description, type, onComplete }: PracticeCardProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const practiceSteps = {
    breathing_478: [
      { text: 'Вдох', duration: 4 },
      { text: 'Задержка', duration: 7 },
      { text: 'Выдох', duration: 8 },
    ],
    square_breathing: [
      { text: 'Вдох', duration: 4 },
      { text: 'Задержка', duration: 4 },
      { text: 'Выдох', duration: 4 },
      { text: 'Задержка', duration: 4 },
    ],
    calm_breathing: [
      { text: 'Вдох', duration: 4 },
      { text: 'Выдох', duration: 6 },
    ],
  };

  const steps = practiceSteps[type];
  const [stepTimer, setStepTimer] = useState(0);

  const startPractice = () => {
    setIsActive(true);
    setCurrentStep(0);
    setSeconds(0);
    setStepTimer(0);
    setIsPaused(false);
    
    // Start the practice timer
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
      setStepTimer(prev => {
        const newStepTimer = prev + 1;
        if (newStepTimer >= steps[currentStep]?.duration) {
          setCurrentStep(prevStep => (prevStep + 1) % steps.length);
          return 0;
        }
        return newStepTimer;
      });
    }, 1000);

    // Store interval ID for cleanup
    (window as any).practiceInterval = interval;
  };

  const pausePractice = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      clearInterval((window as any).practiceInterval);
    } else {
      startPractice();
    }
  };

  const stopPractice = () => {
    setIsActive(false);
    setIsPaused(false);
    clearInterval((window as any).practiceInterval);
    if (seconds > 0) {
      onComplete(type, seconds);
    }
    setSeconds(0);
    setCurrentStep(0);
    setStepTimer(0);
  };

  const resetPractice = () => {
    stopPractice();
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100/50 hover:shadow-md transition-all duration-300">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>

      {isActive ? (
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {steps[currentStep]?.duration - stepTimer}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {steps[currentStep]?.text}
                  </div>
                </div>
              </div>
            </div>
            <div 
              className="absolute top-0 left-0 w-full h-full border-4 border-blue-400 rounded-full transition-all duration-1000"
              style={{
                transform: `rotate(${(stepTimer / steps[currentStep]?.duration) * 360}deg)`,
                clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)'
              }}
            />
          </div>

          <div className="text-lg font-medium text-gray-700 mb-4">
            Общее время: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={pausePractice}
              className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              <span>{isPaused ? 'Продолжить' : 'Пауза'}</span>
            </button>
            
            <button
              onClick={resetPractice}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Сброс</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={startPractice}
            className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Начать практику</span>
          </button>
        </div>
      )}
    </div>
  );
}

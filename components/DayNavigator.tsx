'use client';

interface DayNavigatorProps {
  date: string;
  trainingType: string;
  isTraining: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function DayNavigator({ date, trainingType, isTraining, onPrev, onNext }: DayNavigatorProps) {
  const d = new Date(date + 'T12:00:00');
  const dayName = DAY_NAMES[d.getDay()];
  const formatted = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  const isToday = date === new Date().toISOString().split('T')[0];

  const trainingLabel = trainingType === 'natacion' ? '🏊 Natación'
    : trainingType === 'calistenia' ? '💪 Calistenia'
    : '😴 Descanso';

  return (
    <div className="flex items-center justify-between px-1">
      <button onClick={onPrev} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
        ‹
      </button>
      <div className="flex flex-col items-center">
        <span className="text-sm font-semibold">
          {isToday ? 'Hoy' : dayName} {formatted}
        </span>
        <span className={`text-xs ${isTraining ? 'text-accent' : 'text-text-secondary'}`}>
          {trainingLabel}
        </span>
      </div>
      <button onClick={onNext} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
        ›
      </button>
    </div>
  );
}

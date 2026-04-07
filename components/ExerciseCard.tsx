'use client';

import { useState } from 'react';

interface ExerciseCardProps {
  id: number;
  activity: string;
  duration_min: number | null;
  distance_m: number | null;
  calories_burned: number;
  time: string | null;
  source: string;
  onDelete: (id: number) => void;
}

export default function ExerciseCard({ id, activity, duration_min, distance_m, calories_burned, time, source, onDelete }: ExerciseCardProps) {
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);

  const activityIcon = activity.toLowerCase().includes('natacion') || activity.toLowerCase().includes('nata') ? '🏊' : activity.toLowerCase().includes('calistenia') ? '💪' : '🏃';
  const sourceLabel = source === 'garmin' ? '⌚' : source === 'ai' ? '🤖' : '';

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-burned flex items-center justify-end pr-4 rounded-xl">
        <button onClick={() => onDelete(id)} className="text-white font-semibold text-sm">
          Eliminar
        </button>
      </div>

      <div
        className="relative bg-bg-surface-2 border border-border rounded-xl p-3 transition-transform duration-200"
        style={{ transform: swiped ? 'translateX(-80px)' : 'translateX(0)' }}
        onTouchStart={(e) => setStartX(e.touches[0].clientX)}
        onTouchMove={(e) => {
          const diff = startX - e.touches[0].clientX;
          if (diff > 60) setSwiped(true);
          if (diff < -30) setSwiped(false);
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs">{activityIcon}</span>
              <span className="font-semibold text-sm capitalize">{activity}</span>
              {sourceLabel && <span className="text-xs">{sourceLabel}</span>}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-text-secondary">
              {duration_min && <span>{duration_min} min</span>}
              {distance_m && <span>{distance_m}m</span>}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            {time && <span className="text-xs text-text-secondary">{time}</span>}
            <span className="font-mono font-bold text-burned text-sm">-{Math.round(calories_burned)} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

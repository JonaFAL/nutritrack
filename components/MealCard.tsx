'use client';

import { useState } from 'react';

interface MealCardProps {
  id: number;
  name: string;
  portion: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  time: string | null;
  source: string;
  onDelete: (id: number) => void;
}

export default function MealCard({ id, name, portion, calories, protein_g, carbs_g, fat_g, time, source, onDelete }: MealCardProps) {
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);

  const sourceIcon = source === 'ai_photo' ? '📷' : source === 'ai_text' ? '🤖' : source === 'recipe' ? '👨‍🍳' : '✏️';

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <div className="absolute inset-0 bg-burned flex items-center justify-end pr-4 rounded-xl">
        <button onClick={() => onDelete(id)} className="text-white font-semibold text-sm">
          Eliminar
        </button>
      </div>

      {/* Card content */}
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs">{sourceIcon}</span>
              <span className="font-semibold text-sm truncate">{name}</span>
            </div>
            {portion && <p className="text-xs text-text-secondary mt-0.5">{portion}</p>}
          </div>
          <div className="flex flex-col items-end shrink-0 ml-2">
            {time && <span className="text-xs text-text-secondary">{time}</span>}
            <span className="font-mono font-bold text-accent text-sm">{Math.round(calories)} kcal</span>
          </div>
        </div>

        <div className="flex gap-3 mt-2 text-xs font-mono">
          <span className="text-protein">P:{Math.round(protein_g)}g</span>
          <span className="text-carbs">C:{Math.round(carbs_g)}g</span>
          <span className="text-fat">F:{Math.round(fat_g)}g</span>
        </div>
      </div>
    </div>
  );
}

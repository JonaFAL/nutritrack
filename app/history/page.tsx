'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DaySummary {
  date: string;
  consumed_calories: number;
  burned_calories: number;
  net_calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_count: number;
  exercise_count: number;
}

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getWeekRange(weeksAgo: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() - weeksAgo * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

export default function HistoryPage() {
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetch_data() {
      setLoading(true);
      const { from, to } = getWeekRange(weeksAgo);
      try {
        const res = await fetch('/api/days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to }),
        });
        const data = await res.json();
        setDays(data.days || []);
      } catch {
        setDays([]);
      } finally {
        setLoading(false);
      }
    }
    fetch_data();
  }, [weeksAgo]);

  const { from, to } = getWeekRange(weeksAgo);
  const weekStart = new Date(from + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  const weekEnd = new Date(to + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

  const weekTotal = days.reduce((acc, d) => ({
    calories: acc.calories + d.consumed_calories,
    burned: acc.burned + d.burned_calories,
    protein: acc.protein + d.protein,
  }), { calories: 0, burned: 0, protein: 0 });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Historial</h1>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeeksAgo(w => w + 1)}
          className="p-2 text-text-secondary hover:text-text-primary"
        >
          ‹ Anterior
        </button>
        <span className="text-sm font-medium">{weekStart} - {weekEnd}</span>
        <button
          onClick={() => setWeeksAgo(w => Math.max(0, w - 1))}
          disabled={weeksAgo === 0}
          className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30"
        >
          Siguiente ›
        </button>
      </div>

      {/* Week summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-bg-surface border border-border rounded-xl p-3">
          <div className="font-mono font-bold text-accent">{Math.round(weekTotal.calories)}</div>
          <div className="text-xs text-text-secondary">Ingeridas</div>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-3">
          <div className="font-mono font-bold text-burned">{Math.round(weekTotal.burned)}</div>
          <div className="text-xs text-text-secondary">Quemadas</div>
        </div>
        <div className="bg-bg-surface border border-border rounded-xl p-3">
          <div className="font-mono font-bold text-protein">{Math.round(weekTotal.protein)}g</div>
          <div className="text-xs text-text-secondary">Proteína</div>
        </div>
      </div>

      {/* Day list */}
      {loading ? (
        <div className="text-center text-text-secondary py-8 animate-pulse">Cargando...</div>
      ) : days.length === 0 ? (
        <div className="text-center text-text-secondary py-8 text-sm">
          Sin registros esta semana.
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => {
            const d = new Date(day.date + 'T12:00:00');
            const dayName = DAY_NAMES_SHORT[d.getDay()];
            const dayNum = d.getDate();

            return (
              <button
                key={day.date}
                onClick={() => router.push(`/?date=${day.date}`)}
                className="w-full bg-bg-surface border border-border rounded-xl p-3 flex items-center gap-3 text-left hover:border-accent/50 transition-colors"
              >
                <div className="w-10 text-center">
                  <div className="text-xs text-text-secondary">{dayName}</div>
                  <div className="font-bold">{dayNum}</div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-1 text-xs font-mono">
                  <div>
                    <span className="text-text-secondary">Cal: </span>
                    <span className="text-accent">{day.consumed_calories}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Prot: </span>
                    <span className="text-protein">{day.protein}g</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Neto: </span>
                    <span className={day.net_calories > 2500 ? 'text-carbs' : 'text-accent'}>{day.net_calories}</span>
                  </div>
                </div>

                <div className="text-xs text-text-secondary">
                  {day.meal_count}🍽 {day.exercise_count}🏃
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

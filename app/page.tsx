'use client';

import { useState, useEffect, useCallback } from 'react';
import CalorieRing from '@/components/CalorieRing';
import MacroBars from '@/components/MacroBars';
import MealCard from '@/components/MealCard';
import ExerciseCard from '@/components/ExerciseCard';
import DayNavigator from '@/components/DayNavigator';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function shiftDate(date: string, days: number) {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface DayData {
  date: string;
  is_training_day: boolean;
  training_type: string;
  goal_calories: number;
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  burned: number;
  net_calories: number;
  meals: Array<{
    id: number; name: string; portion: string | null; calories: number;
    protein_g: number; carbs_g: number; fat_g: number; time: string | null; source: string;
  }>;
  exercises: Array<{
    id: number; activity: string; duration_min: number | null; distance_m: number | null;
    calories_burned: number; time: string | null; source: string;
  }>;
  profile: { goal_protein_g: number; goal_carbs_g: number; goal_fat_g: number };
}

export default function Dashboard() {
  const [date, setDate] = useState(getToday());
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDay = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/days?date=${d}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch day:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDay(date); }, [date, fetchDay]);

  async function handleDeleteMeal(id: number) {
    await fetch(`/api/meals?id=${id}`, { method: 'DELETE' });
    fetchDay(date);
  }

  async function handleDeleteExercise(id: number) {
    await fetch(`/api/exercises?id=${id}`, { method: 'DELETE' });
    fetchDay(date);
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-secondary animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 space-y-5">
      {/* Day navigator */}
      <DayNavigator
        date={date}
        trainingType={data.training_type}
        isTraining={data.is_training_day}
        onPrev={() => setDate(shiftDate(date, -1))}
        onNext={() => setDate(shiftDate(date, 1))}
      />

      {/* Calorie ring */}
      <CalorieRing
        consumed={data.consumed.calories}
        burned={data.burned}
        goal={data.goal_calories}
      />

      {/* Macro bars */}
      <div className="bg-bg-surface border border-border rounded-xl p-4">
        <MacroBars
          protein={data.consumed.protein}
          carbs={data.consumed.carbs}
          fat={data.consumed.fat}
          goalProtein={data.profile.goal_protein_g}
          goalCarbs={data.profile.goal_carbs_g}
          goalFat={data.profile.goal_fat_g}
        />
      </div>

      {/* Meals */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-2">
          Comidas ({data.meals.length})
        </h2>
        <div className="space-y-2">
          {data.meals.length === 0 ? (
            <p className="text-center text-xs text-text-secondary py-4">
              Sin comidas registradas. Usá el Chat IA para agregar.
            </p>
          ) : (
            data.meals.map((meal) => (
              <MealCard key={meal.id} {...meal} onDelete={handleDeleteMeal} />
            ))
          )}
        </div>
      </div>

      {/* Exercises */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-2">
          Ejercicio ({data.exercises.length})
        </h2>
        <div className="space-y-2">
          {data.exercises.length === 0 ? (
            <p className="text-center text-xs text-text-secondary py-4">
              Sin ejercicio registrado.
            </p>
          ) : (
            data.exercises.map((ex) => (
              <ExerciseCard key={ex.id} {...ex} onDelete={handleDeleteExercise} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

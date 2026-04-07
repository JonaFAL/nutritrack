'use client';

import { useState } from 'react';
import ChatInput from '@/components/ChatInput';
import RecipeView from '@/components/RecipeView';
import type { ChatMode, AIMealResponse, AIExerciseResponse, AIRecipeResponse } from '@/lib/types';

interface ChatEntry {
  id: number;
  mode: ChatMode;
  userMessage: string;
  hasImage: boolean;
  response: AIMealResponse | AIExerciseResponse | AIRecipeResponse | null;
  error: string | null;
}

const API_ENDPOINTS: Record<ChatMode, string> = {
  meal: '/api/ai/analyze',
  exercise: '/api/ai/exercise',
  recipe: '/api/ai/recipe',
};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function ChatPage() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSend(message: string, mode: ChatMode, imageBase64?: string, imageMimeType?: string) {
    setLoading(true);
    const entryId = Date.now();

    const newEntry: ChatEntry = {
      id: entryId,
      mode,
      userMessage: message || (imageBase64 ? '[Foto]' : ''),
      hasImage: !!imageBase64,
      response: null,
      error: null,
    };
    setEntries(prev => [...prev, newEntry]);

    try {
      const res = await fetch(API_ENDPOINTS[mode], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, date: getToday(), imageBase64, imageMimeType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, error: data.error || 'Error desconocido' } : e));
      } else {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, response: data } : e));
      }
    } catch (err) {
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, error: err instanceof Error ? err.message : 'Error de red' } : e,
      ));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRecipeToLog(entry: ChatEntry, servings: number) {
    if (entry.response?.type !== 'recipe') return;
    const recipe = entry.response as AIRecipeResponse;

    await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: getToday(),
        time: new Date().toTimeString().slice(0, 5),
        name: recipe.title,
        portion: `${servings} porción(es)`,
        calories: recipe.per_serving.calories * servings,
        protein_g: recipe.per_serving.protein * servings,
        carbs_g: recipe.per_serving.carbs * servings,
        fat_g: recipe.per_serving.fat * servings,
        source: 'recipe',
      }),
    });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Chat entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary text-sm space-y-2">
            <span className="text-4xl">🤖</span>
            <p>Contame qué comiste, qué entrenaste, o pedí una receta.</p>
            <p className="text-xs">Cada mensaje es independiente, no se acumula historial.</p>
          </div>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="space-y-2">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="bg-bg-surface-2 border border-border rounded-xl px-3 py-2 max-w-[85%]">
                <p className="text-sm">{entry.userMessage}</p>
                {entry.hasImage && <span className="text-xs text-text-secondary">📷 Con foto</span>}
              </div>
            </div>

            {/* AI response */}
            {entry.error ? (
              <div className="bg-burned/10 border border-burned/30 rounded-xl px-3 py-2">
                <p className="text-sm text-burned">Error: {entry.error}</p>
              </div>
            ) : entry.response ? (
              <div className="space-y-2">
                {entry.response.type === 'meal_log' && <MealLogView data={entry.response as AIMealResponse} />}
                {entry.response.type === 'exercise_log' && <ExerciseLogView data={entry.response as AIExerciseResponse} />}
                {entry.response.type === 'recipe' && (
                  <RecipeView
                    recipe={entry.response as AIRecipeResponse}
                    onAddToLog={(servings) => handleAddRecipeToLog(entry, servings)}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <span className="animate-pulse">⏳</span> Analizando...
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} loading={loading} />
    </div>
  );
}

function MealLogView({ data }: { data: AIMealResponse }) {
  return (
    <div className="bg-bg-surface-2 border border-border rounded-xl p-3 space-y-3">
      {/* Items */}
      {data.items.map((item, i) => (
        <div key={i} className="flex justify-between items-start">
          <div>
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-xs text-text-secondary ml-2">{item.portion}</span>
          </div>
          <span className="font-mono text-sm text-accent">{Math.round(item.calories)} kcal</span>
        </div>
      ))}

      {/* Totals */}
      <div className="border-t border-border pt-2 flex justify-between">
        <div className="flex gap-2 text-xs font-mono">
          <span className="text-protein">P:{Math.round(data.total_protein)}g</span>
          <span className="text-carbs">C:{Math.round(data.total_carbs)}g</span>
          <span className="text-fat">F:{Math.round(data.total_fat)}g</span>
        </div>
        <span className="font-mono font-bold text-accent">{Math.round(data.total_calories)} kcal</span>
      </div>

      {/* Balance */}
      <div className="bg-bg-primary rounded-lg p-2 text-xs">
        <div className="flex justify-between mb-1">
          <span className="text-text-secondary">Balance del día</span>
          <span className={`font-mono font-semibold ${
            data.daily_balance.status === 'deficit_alto' ? 'text-burned'
            : data.daily_balance.status === 'superavit' ? 'text-carbs'
            : 'text-accent'
          }`}>
            {data.daily_balance.remaining > 0 ? `Faltan ${Math.round(data.daily_balance.remaining)} kcal` : `Excedido ${Math.round(Math.abs(data.daily_balance.remaining))} kcal`}
          </span>
        </div>
      </div>

      {/* Opinion */}
      <p className="text-xs text-text-secondary italic">{data.opinion}</p>
    </div>
  );
}

function ExerciseLogView({ data }: { data: AIExerciseResponse }) {
  return (
    <div className="bg-bg-surface-2 border border-border rounded-xl p-3 space-y-3">
      {data.items.map((item, i) => (
        <div key={i} className="flex justify-between items-start">
          <div>
            <span className="text-sm font-medium capitalize">{item.activity}</span>
            <div className="flex gap-2 text-xs text-text-secondary">
              <span>{item.duration_min} min</span>
              {item.distance_m && <span>{item.distance_m}m</span>}
              <span className="capitalize">{item.intensity}</span>
            </div>
          </div>
          <span className="font-mono text-sm text-burned">-{Math.round(item.calories_burned)} kcal</span>
        </div>
      ))}

      <div className="border-t border-border pt-2 flex justify-between">
        <span className="text-xs text-text-secondary">Total quemado</span>
        <span className="font-mono font-bold text-burned">-{Math.round(data.total_burned)} kcal</span>
      </div>

      <p className="text-xs text-text-secondary italic">{data.opinion}</p>
    </div>
  );
}

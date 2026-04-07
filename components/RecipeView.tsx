'use client';

import type { AIRecipeResponse } from '@/lib/types';

interface RecipeViewProps {
  recipe: AIRecipeResponse;
  onAddToLog?: (servings: number) => void;
}

export default function RecipeView({ recipe, onAddToLog }: RecipeViewProps) {
  return (
    <div className="bg-bg-surface-2 border border-border rounded-xl p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-bold text-lg">{recipe.title}</h3>
        <div className="flex gap-3 text-xs text-text-secondary mt-1">
          <span>🍽 {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}</span>
          <span>⏱ {recipe.prep_time_min + recipe.cook_time_min} min</span>
          {recipe.batch_cooking && <span>📦 Batch ({recipe.storage_days}d)</span>}
        </div>
      </div>

      {/* Macros per serving */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Calorías', value: recipe.per_serving.calories, unit: 'kcal', color: '#C4F538' },
          { label: 'Proteína', value: recipe.per_serving.protein, unit: 'g', color: '#4DA6FF' },
          { label: 'Carbos', value: recipe.per_serving.carbs, unit: 'g', color: '#FF9F43' },
          { label: 'Grasas', value: recipe.per_serving.fat, unit: 'g', color: '#C4F538' },
        ].map((m) => (
          <div key={m.label} className="bg-bg-primary rounded-lg p-2">
            <div className="font-mono font-bold text-sm" style={{ color: m.color }}>
              {Math.round(m.value)}
            </div>
            <div className="text-xs text-text-secondary">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Ingredientes</h4>
        <ul className="space-y-1 text-sm">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent shrink-0">•</span>
              <span>
                <span className="font-mono text-xs text-accent">{ing.amount}</span>{' '}
                {ing.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Preparación</h4>
        <ol className="space-y-2 text-sm">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-accent shrink-0 text-xs mt-0.5">{i + 1}.</span>
              <span className="text-text-secondary">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tips */}
      {recipe.tips && (
        <p className="text-xs text-text-secondary italic bg-bg-primary rounded-lg p-2">
          💡 {recipe.tips}
        </p>
      )}

      {/* Equipment */}
      <div className="flex flex-wrap gap-2">
        {recipe.equipment_used.map((eq) => (
          <span key={eq} className="text-xs bg-bg-primary border border-border rounded-full px-2 py-0.5 text-text-secondary">
            {eq}
          </span>
        ))}
      </div>

      {/* Add to log button */}
      {onAddToLog && (
        <button
          onClick={() => onAddToLog(1)}
          className="w-full bg-accent text-bg-primary font-semibold py-2 rounded-lg text-sm"
        >
          Registrar 1 porción ({Math.round(recipe.per_serving.calories)} kcal)
        </button>
      )}
    </div>
  );
}

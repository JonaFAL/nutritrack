import OpenAI from 'openai';
import { getDb } from './db';
import type { Profile, TrainingSchedule } from './types';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = 'qwen/qwen3.6-plus:free';

const DAY_NAMES: Record<string, keyof TrainingSchedule> = {
  '0': 'sun', '1': 'mon', '2': 'tue', '3': 'wed',
  '4': 'thu', '5': 'fri', '6': 'sat',
};

const TRAINING_TIMES: Record<string, string> = {
  calistenia: '16:30',
  natacion: '18:30',
  descanso: '-',
};

export function getProfile(): Profile {
  const db = getDb();
  return db.prepare('SELECT * FROM profile WHERE id = 1').get() as Profile;
}

export function getDayContext(date: string) {
  const db = getDb();
  const profile = getProfile();
  const schedule: TrainingSchedule = JSON.parse(profile.training_schedule);

  const dayOfWeek = new Date(date + 'T12:00:00').getDay().toString();
  const dayKey = DAY_NAMES[dayOfWeek];
  const trainingType = schedule[dayKey] || 'descanso';
  const isTraining = trainingType !== 'descanso';
  const goalCalories = isTraining ? profile.goal_calories_training : profile.goal_calories_rest;

  const meals = db.prepare('SELECT * FROM meals WHERE date = ? ORDER BY time, created_at').all(date);
  const exercises = db.prepare('SELECT * FROM exercises WHERE date = ? ORDER BY time, created_at').all(date);

  const consumed = {
    calories: 0, protein: 0, carbs: 0, fat: 0,
  };
  for (const m of meals as Array<{ calories: number; protein_g: number; carbs_g: number; fat_g: number }>) {
    consumed.calories += m.calories;
    consumed.protein += m.protein_g;
    consumed.carbs += m.carbs_g;
    consumed.fat += m.fat_g;
  }

  let burned = 0;
  const exerciseSummary: string[] = [];
  for (const e of exercises as Array<{ activity: string; calories_burned: number; duration_min: number }>) {
    burned += e.calories_burned;
    exerciseSummary.push(`${e.activity} (${e.duration_min}min, ${e.calories_burned}kcal)`);
  }

  return {
    date,
    trainingType,
    trainingTime: TRAINING_TIMES[trainingType] || '-',
    isTraining,
    goalCalories,
    profile,
    consumed,
    burned,
    exerciseSummary: exerciseSummary.length > 0 ? exerciseSummary.join(', ') : 'Ninguno registrado',
    meals,
    exercises,
  };
}

function buildMealSystemPrompt(ctx: ReturnType<typeof getDayContext>): string {
  return `Sos un nutricionista deportivo experto. Tu cliente es Jonathan (Jony), ${ctx.profile.weight_kg}kg, ${ctx.profile.muscle_pct}% músculo, ${ctx.profile.fat_pct}% grasa, que entrena calistenia y natación (4000-4600m) día por medio.

Respondé SIEMPRE en JSON válido, sin markdown, sin backticks, sin texto adicional.

PERFIL DEL DÍA:
- Fecha: ${ctx.date}
- Día de: ${ctx.trainingType} (entrenamiento a las ${ctx.trainingTime})
- Objetivo calórico hoy: ${ctx.goalCalories} kcal
- Macros objetivo: P:${ctx.profile.goal_protein_g}g C:${ctx.profile.goal_carbs_g}g F:${ctx.profile.goal_fat_g}g
- Consumido hasta ahora: ${Math.round(ctx.consumed.calories)} kcal (P:${Math.round(ctx.consumed.protein)}g C:${Math.round(ctx.consumed.carbs)}g F:${Math.round(ctx.consumed.fat)}g)
- Ejercicio registrado: ${ctx.exerciseSummary}

Cuando el usuario describe una comida o sube una foto de comida, respondé con:
{
  "type": "meal_log",
  "items": [
    {
      "name": "nombre del alimento",
      "portion": "porción estimada en gramos o unidades",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "daily_balance": {
    "consumed_after": number,
    "remaining": number,
    "status": "ok" | "deficit_alto" | "superavit" | "en_rango"
  },
  "opinion": "Comentario breve y directo sobre el balance. Si hay déficit grande o superávit, decilo. Si es día de entrenamiento y falta proteína, avisá."
}`;
}

function buildExerciseSystemPrompt(ctx: ReturnType<typeof getDayContext>): string {
  return `Sos un experto en fisiología del ejercicio. Tu cliente es Jonathan, ${ctx.profile.weight_kg}kg, nada 4000-4600m y hace calistenia en barras.

Respondé SIEMPRE en JSON válido, sin markdown, sin backticks.

PERFIL DEL DÍA:
- Fecha: ${ctx.date}
- Consumido hasta ahora: ${Math.round(ctx.consumed.calories)} kcal
- Objetivo calórico hoy: ${ctx.goalCalories} kcal

Cuando el usuario describe ejercicio, respondé con:
{
  "type": "exercise_log",
  "items": [
    {
      "activity": "nombre",
      "duration_min": number,
      "distance_m": number | null,
      "calories_burned": number,
      "intensity": "baja" | "moderada" | "alta" | "muy_alta"
    }
  ],
  "total_burned": number,
  "opinion": "Comentario breve. Si el usuario pasó dato del Garmin, usá ese. Si no, estimá basándote en su peso y la actividad."
}

IMPORTANTE: Si el usuario dice que su reloj Garmin marcó X calorías, usá ese dato como fuente primaria. Solo estimá si no tiene dato del reloj.`;
}

function buildRecipeSystemPrompt(ctx: ReturnType<typeof getDayContext>): string {
  return `Sos un chef nutricionista. Tu cliente es Jonathan, ${ctx.profile.weight_kg}kg, que hace batch cooking con ${ctx.profile.kitchen_equipment}.

Respondé SIEMPRE en JSON válido, sin markdown, sin backticks.

EQUIPAMIENTO DISPONIBLE: ${ctx.profile.kitchen_equipment}
OBJETIVO CALÓRICO: ${ctx.goalCalories} kcal/día
MACROS OBJETIVO: P:${ctx.profile.goal_protein_g}g C:${ctx.profile.goal_carbs_g}g F:${ctx.profile.goal_fat_g}g

Cuando el usuario dice qué ingredientes tiene o pide una receta, respondé con:
{
  "type": "recipe",
  "title": "nombre de la receta",
  "servings": number,
  "batch_cooking": boolean,
  "storage_days": number,
  "equipment_used": ["olla a presión eléctrica"],
  "prep_time_min": number,
  "cook_time_min": number,
  "ingredients": [
    {"name": "ingrediente", "amount": "cantidad exacta con unidad"}
  ],
  "steps": ["paso 1 detallado", "paso 2 detallado"],
  "totals": {
    "calories": number, "protein": number, "carbs": number, "fat": number
  },
  "per_serving": {
    "calories": number, "protein": number, "carbs": number, "fat": number
  },
  "tips": "Consejo de almacenamiento o variación opcional"
}

IMPORTANTE: Cantidades EXACTAS en gramos o ml. Nada de "a gusto" o "un poco de". El usuario necesita trackear macros.`;
}

export type AIMode = 'meal' | 'exercise' | 'recipe';

const PROMPT_BUILDERS: Record<AIMode, (ctx: ReturnType<typeof getDayContext>) => string> = {
  meal: buildMealSystemPrompt,
  exercise: buildExerciseSystemPrompt,
  recipe: buildRecipeSystemPrompt,
};

export async function callAI(
  mode: AIMode,
  date: string,
  userMessage: string,
  imageBase64?: string,
  imageMimeType?: string,
) {
  const ctx = getDayContext(date);
  const systemPrompt = PROMPT_BUILDERS[mode](ctx);

  type MessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

  let userContent: MessageContent;

  if (imageBase64 && imageMimeType) {
    userContent = [
      { type: 'image_url', image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } },
      { type: 'text', text: userMessage || 'Analizá esta comida y dame el breakdown nutricional' },
    ];
  } else {
    userContent = userMessage;
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    max_tokens: 1024,
  });

  const rawText = response.choices[0]?.message?.content || '';

  // Strip markdown code fences if model wraps JSON in them
  const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  try {
    return { success: true, data: JSON.parse(cleaned), raw: rawText };
  } catch {
    return { success: false, data: null, raw: rawText, error: 'Failed to parse AI response as JSON' };
  }
}

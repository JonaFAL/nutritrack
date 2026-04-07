// ==================== Database Models ====================

export interface Profile {
  id: number;
  name: string;
  weight_kg: number;
  muscle_pct: number;
  fat_pct: number;
  tmb_kcal: number;
  goal_calories_training: number;
  goal_calories_rest: number;
  goal_protein_g: number;
  goal_carbs_g: number;
  goal_fat_g: number;
  training_schedule: string; // JSON
  kitchen_equipment: string;
  supplements: string;
  updated_at: string;
}

export interface Meal {
  id: number;
  date: string;
  time: string | null;
  name: string;
  portion: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  source: 'manual' | 'ai_text' | 'ai_photo' | 'recipe';
  ai_raw_response: string | null;
  notes: string | null;
  created_at: string;
}

export interface Exercise {
  id: number;
  date: string;
  time: string | null;
  activity: string;
  duration_min: number | null;
  distance_m: number | null;
  calories_burned: number;
  source: 'manual' | 'ai' | 'garmin';
  garmin_data: string | null;
  notes: string | null;
  created_at: string;
}

export interface Recipe {
  id: number;
  title: string;
  servings: number;
  ingredients: string; // JSON array
  steps: string; // JSON array
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  per_serving_calories: number | null;
  per_serving_protein_g: number | null;
  per_serving_carbs_g: number | null;
  per_serving_fat_g: number | null;
  tags: string | null; // JSON array
  created_at: string;
}

export interface DailyNote {
  date: string;
  is_training_day: boolean;
  training_type: string | null;
  fasting_hours: number | null;
  notes: string | null;
  ai_summary: string | null;
}

// ==================== AI Response Types ====================

export interface AIMealItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface AIMealResponse {
  type: 'meal_log';
  items: AIMealItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  daily_balance: {
    consumed_after: number;
    remaining: number;
    status: 'ok' | 'deficit_alto' | 'superavit' | 'en_rango';
  };
  opinion: string;
}

export interface AIExerciseItem {
  activity: string;
  duration_min: number;
  distance_m: number | null;
  calories_burned: number;
  intensity: 'baja' | 'moderada' | 'alta' | 'muy_alta';
}

export interface AIExerciseResponse {
  type: 'exercise_log';
  items: AIExerciseItem[];
  total_burned: number;
  opinion: string;
}

export interface AIRecipeIngredient {
  name: string;
  amount: string;
}

export interface AIRecipeResponse {
  type: 'recipe';
  title: string;
  servings: number;
  batch_cooking: boolean;
  storage_days: number;
  equipment_used: string[];
  prep_time_min: number;
  cook_time_min: number;
  ingredients: AIRecipeIngredient[];
  steps: string[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  per_serving: { calories: number; protein: number; carbs: number; fat: number };
  tips: string;
}

// ==================== API Request Types ====================

export interface DaySummary {
  date: string;
  is_training_day: boolean;
  training_type: string;
  goal_calories: number;
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  burned: number;
  net_calories: number;
  meals: Meal[];
  exercises: Exercise[];
}

export type ChatMode = 'meal' | 'exercise' | 'recipe';

export interface TrainingSchedule {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

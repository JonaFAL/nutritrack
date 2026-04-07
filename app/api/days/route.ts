import { NextResponse } from 'next/server';
import { getDayContext, getProfile } from '@/lib/ai';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const ctx = getDayContext(date);

  const netCalories = ctx.consumed.calories - ctx.burned;

  return NextResponse.json({
    date: ctx.date,
    is_training_day: ctx.isTraining,
    training_type: ctx.trainingType,
    training_time: ctx.trainingTime,
    goal_calories: ctx.goalCalories,
    consumed: {
      calories: Math.round(ctx.consumed.calories),
      protein: Math.round(ctx.consumed.protein),
      carbs: Math.round(ctx.consumed.carbs),
      fat: Math.round(ctx.consumed.fat),
    },
    burned: Math.round(ctx.burned),
    net_calories: Math.round(netCalories),
    meals: ctx.meals,
    exercises: ctx.exercises,
    profile: {
      goal_protein_g: ctx.profile.goal_protein_g,
      goal_carbs_g: ctx.profile.goal_carbs_g,
      goal_fat_g: ctx.profile.goal_fat_g,
    },
  });
}

// GET history of multiple days
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to } = body;

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 });
    }

    const db = getDb();
    const profile = getProfile();

    const meals = db.prepare(`
      SELECT date, SUM(calories) as total_cal, SUM(protein_g) as total_protein,
             SUM(carbs_g) as total_carbs, SUM(fat_g) as total_fat, COUNT(*) as meal_count
      FROM meals WHERE date BETWEEN ? AND ? GROUP BY date
    `).all(from, to) as Array<{
      date: string; total_cal: number; total_protein: number;
      total_carbs: number; total_fat: number; meal_count: number;
    }>;

    const exercises = db.prepare(`
      SELECT date, SUM(calories_burned) as total_burned, COUNT(*) as exercise_count
      FROM exercises WHERE date BETWEEN ? AND ? GROUP BY date
    `).all(from, to) as Array<{ date: string; total_burned: number; exercise_count: number }>;

    const exerciseMap = new Map(exercises.map(e => [e.date, e]));

    const days = meals.map(m => {
      const ex = exerciseMap.get(m.date);
      return {
        date: m.date,
        consumed_calories: Math.round(m.total_cal),
        burned_calories: ex ? Math.round(ex.total_burned) : 0,
        net_calories: Math.round(m.total_cal - (ex?.total_burned || 0)),
        protein: Math.round(m.total_protein),
        carbs: Math.round(m.total_carbs),
        fat: Math.round(m.total_fat),
        meal_count: m.meal_count,
        exercise_count: ex?.exercise_count || 0,
      };
    });

    return NextResponse.json({ days, profile: { goal_protein_g: profile.goal_protein_g, goal_carbs_g: profile.goal_carbs_g, goal_fat_g: profile.goal_fat_g } });
  } catch (error) {
    console.error('Days history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

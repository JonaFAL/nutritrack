import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getDb } from '@/lib/db';
import type { AIRecipeResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, date } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const effectiveDate = date || new Date().toISOString().split('T')[0];
    const result = await callAI('recipe', effectiveDate, message);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 422 });
    }

    const data = result.data as AIRecipeResponse;
    const db = getDb();

    const info = db.prepare(`
      INSERT INTO recipes (title, servings, ingredients, steps, total_calories, total_protein_g, total_carbs_g, total_fat_g, per_serving_calories, per_serving_protein_g, per_serving_carbs_g, per_serving_fat_g, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title, data.servings,
      JSON.stringify(data.ingredients), JSON.stringify(data.steps),
      data.totals.calories, data.totals.protein, data.totals.carbs, data.totals.fat,
      data.per_serving.calories, data.per_serving.protein, data.per_serving.carbs, data.per_serving.fat,
      JSON.stringify(data.equipment_used),
    );

    return NextResponse.json({ ...data, recipe_id: Number(info.lastInsertRowid) });
  } catch (error) {
    console.error('AI recipe error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

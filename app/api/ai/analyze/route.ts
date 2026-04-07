import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getDb } from '@/lib/db';
import type { AIMealResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, date, imageBase64, imageMimeType } = body;

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const result = await callAI('meal', date, message, imageBase64, imageMimeType);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 422 });
    }

    const data = result.data as AIMealResponse;
    const db = getDb();
    const now = new Date().toTimeString().slice(0, 5);

    const insertMeal = db.prepare(`
      INSERT INTO meals (date, time, name, portion, calories, protein_g, carbs_g, fat_g, fiber_g, source, ai_raw_response)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction(() => {
      const ids: number[] = [];
      for (const item of data.items) {
        const info = insertMeal.run(
          date, now, item.name, item.portion,
          item.calories, item.protein, item.carbs, item.fat, item.fiber,
          imageBase64 ? 'ai_photo' : 'ai_text',
          result.raw,
        );
        ids.push(Number(info.lastInsertRowid));
      }
      return ids;
    });

    const mealIds = insertMany();

    return NextResponse.json({ ...data, meal_ids: mealIds });
  } catch (error) {
    console.error('AI analyze error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

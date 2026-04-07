import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getDb } from '@/lib/db';
import type { AIExerciseResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, date } = body;

    if (!date || !message) {
      return NextResponse.json({ error: 'date and message are required' }, { status: 400 });
    }

    const result = await callAI('exercise', date, message);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 422 });
    }

    const data = result.data as AIExerciseResponse;
    const db = getDb();
    const now = new Date().toTimeString().slice(0, 5);

    const insertExercise = db.prepare(`
      INSERT INTO exercises (date, time, activity, duration_min, distance_m, calories_burned, source, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'ai', ?)
    `);

    const insertMany = db.transaction(() => {
      const ids: number[] = [];
      for (const item of data.items) {
        const info = insertExercise.run(
          date, now, item.activity, item.duration_min,
          item.distance_m, item.calories_burned, data.opinion,
        );
        ids.push(Number(info.lastInsertRowid));
      }
      return ids;
    });

    const exerciseIds = insertMany();

    return NextResponse.json({ ...data, exercise_ids: exerciseIds });
  } catch (error) {
    console.error('AI exercise error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const db = getDb();

  if (date) {
    const exercises = db.prepare('SELECT * FROM exercises WHERE date = ? ORDER BY time, created_at').all(date);
    return NextResponse.json(exercises);
  }

  const exercises = db.prepare('SELECT * FROM exercises ORDER BY date DESC, time DESC LIMIT 100').all();
  return NextResponse.json(exercises);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, time, activity, duration_min, distance_m, calories_burned, source, garmin_data, notes } = body;

    if (!date || !activity || calories_burned == null) {
      return NextResponse.json({ error: 'date, activity, and calories_burned are required' }, { status: 400 });
    }

    const db = getDb();
    const info = db.prepare(`
      INSERT INTO exercises (date, time, activity, duration_min, distance_m, calories_burned, source, garmin_data, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(date, time, activity, duration_min, distance_m, calories_burned, source || 'manual', garmin_data, notes);

    return NextResponse.json({ id: Number(info.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('Create exercise error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const db = getDb();
  db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
  return NextResponse.json({ deleted: true });
}

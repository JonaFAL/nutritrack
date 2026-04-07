import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const db = getDb();

  if (date) {
    const meals = db.prepare('SELECT * FROM meals WHERE date = ? ORDER BY time, created_at').all(date);
    return NextResponse.json(meals);
  }

  const meals = db.prepare('SELECT * FROM meals ORDER BY date DESC, time DESC LIMIT 100').all();
  return NextResponse.json(meals);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, time, name, portion, calories, protein_g, carbs_g, fat_g, fiber_g, source, notes } = body;

    if (!date || !name || calories == null) {
      return NextResponse.json({ error: 'date, name, and calories are required' }, { status: 400 });
    }

    const db = getDb();
    const info = db.prepare(`
      INSERT INTO meals (date, time, name, portion, calories, protein_g, carbs_g, fat_g, fiber_g, source, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(date, time, name, portion, calories, protein_g || 0, carbs_g || 0, fat_g || 0, fiber_g || 0, source || 'manual', notes);

    return NextResponse.json({ id: Number(info.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('Create meal error:', error);
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
  db.prepare('DELETE FROM meals WHERE id = ?').run(id);
  return NextResponse.json({ deleted: true });
}

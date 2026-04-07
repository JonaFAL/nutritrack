import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();

    const fields: string[] = [];
    const values: unknown[] = [];

    const allowedFields = [
      'name', 'weight_kg', 'muscle_pct', 'fat_pct', 'tmb_kcal',
      'goal_calories_training', 'goal_calories_rest',
      'goal_protein_g', 'goal_carbs_g', 'goal_fat_g',
      'training_schedule', 'kitchen_equipment', 'supplements',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field]);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(1); // WHERE id = 1

    db.prepare(`UPDATE profile SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

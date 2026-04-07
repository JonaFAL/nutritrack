import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM pantry ORDER BY category, storage, name').all();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support bulk insert
    const items = Array.isArray(body) ? body : [body];
    const db = getDb();

    const insert = db.prepare(`
      INSERT INTO pantry (name, quantity_g, unit, category, storage, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction(() => {
      const ids: number[] = [];
      for (const item of items) {
        if (!item.name) continue;
        const info = insert.run(
          item.name,
          item.quantity_g ?? null,
          item.unit || 'g',
          item.category || 'ingrediente',
          item.storage || 'alacena',
          item.notes || null,
        );
        ids.push(Number(info.lastInsertRowid));
      }
      return ids;
    });

    const ids = insertMany();
    return NextResponse.json({ ids }, { status: 201 });
  } catch (error) {
    console.error('Pantry create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const key of ['name', 'quantity_g', 'unit', 'category', 'storage', 'notes']) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE pantry SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM pantry WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Pantry update error:', error);
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
  db.prepare('DELETE FROM pantry WHERE id = ?').run(id);
  return NextResponse.json({ deleted: true });
}

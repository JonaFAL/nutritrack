import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM equipment ORDER BY name').all();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];
    const db = getDb();

    const insert = db.prepare('INSERT INTO equipment (name, notes) VALUES (?, ?)');

    const insertMany = db.transaction(() => {
      const ids: number[] = [];
      for (const item of items) {
        if (!item.name) continue;
        const info = insert.run(item.name, item.notes || null);
        ids.push(Number(info.lastInsertRowid));
      }
      return ids;
    });

    const ids = insertMany();
    return NextResponse.json({ ids }, { status: 201 });
  } catch (error) {
    console.error('Equipment create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, notes } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const db = getDb();
    db.prepare('UPDATE equipment SET name = COALESCE(?, name), notes = COALESCE(?, notes) WHERE id = ?')
      .run(name || null, notes !== undefined ? notes : null, id);

    const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Equipment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = getDb();
  db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
  return NextResponse.json({ deleted: true });
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const INITIAL_INGREDIENTS = [
  { name: 'Arvejas', quantity_g: 900, storage: 'congelado' },
  { name: 'Papas prefritas para airfryer', quantity_g: 600, storage: 'congelado' },
  { name: 'Chauchas', quantity_g: 695, storage: 'congelado' },
  { name: 'Zucchini', quantity_g: 678, storage: 'congelado' },
  { name: 'Brócoli', quantity_g: 500, storage: 'congelado' },
  { name: 'Espinaca', quantity_g: 860, storage: 'congelado' },
  { name: 'Pechuga Trozo', quantity_g: 732, storage: 'congelado' },
  { name: 'Pechuga Trozo', quantity_g: 693, storage: 'congelado' },
  { name: 'Hamburguesa pollo (de pollería)', quantity_g: 95, storage: 'congelado' },
  { name: 'Milanesas pollo (de pollería)', quantity_g: null, storage: 'congelado' },
  { name: 'Atún latas', quantity_g: 120, storage: 'alacena', notes: 'escurrido' },
  { name: 'Arroz integral yamaní', quantity_g: null, storage: 'alacena' },
  { name: 'Fideos varios', quantity_g: null, storage: 'alacena' },
  { name: 'Huevos', quantity_g: null, storage: 'heladera' },
  { name: 'Harina de coco', quantity_g: null, storage: 'alacena' },
  { name: 'Harina de trigo integral', quantity_g: null, storage: 'alacena' },
  { name: 'Polvo Pancakes proteicos', quantity_g: null, storage: 'alacena' },
  { name: 'Arvejas en tetrabrick', quantity_g: null, storage: 'alacena' },
  { name: 'Rapiditas light', quantity_g: null, storage: 'alacena' },
];

const INITIAL_CONDIMENTS = [
  'Orégano', 'Sal', 'Curry en polvo', 'Chile habanero', 'Pepperoncino',
  'Esencia de Vainilla', 'Aceite de oliva', 'Aceite de girasol',
  'Aceite de oliva en spray', 'Aceite de girasol en spray',
  'Ají molido', 'Vinagre de alcohol',
];

const INITIAL_EQUIPMENT = [
  { name: 'Cocina a gas (4 hornallas)', notes: 'Horno disponible pero prefiere no usarlo' },
  { name: 'Freidora de aire (Airfryer)', notes: null },
  { name: 'Olla a presión eléctrica', notes: 'Atma / Fussion Cook CS7' },
  { name: 'Sartén de teflón', notes: null },
  { name: 'Sartén de acero inoxidable', notes: null },
  { name: 'Ollas varias', notes: null },
  { name: 'Minipimer (licuadora de mano)', notes: null },
];

export async function POST() {
  const db = getDb();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM pantry').get() as { c: number };
  const eqCount = db.prepare('SELECT COUNT(*) as c FROM equipment').get() as { c: number };

  if (count.c > 0 || eqCount.c > 0) {
    return NextResponse.json({ message: 'Already seeded', pantry: count.c, equipment: eqCount.c });
  }

  const insertPantry = db.prepare(
    'INSERT INTO pantry (name, quantity_g, category, storage, notes) VALUES (?, ?, ?, ?, ?)'
  );
  const insertEquipment = db.prepare(
    'INSERT INTO equipment (name, notes) VALUES (?, ?)'
  );

  const seed = db.transaction(() => {
    for (const item of INITIAL_INGREDIENTS) {
      insertPantry.run(item.name, item.quantity_g ?? null, 'ingrediente', item.storage, (item as { notes?: string }).notes || null);
    }
    for (const name of INITIAL_CONDIMENTS) {
      insertPantry.run(name, null, 'condimento', 'alacena', null);
    }
    for (const item of INITIAL_EQUIPMENT) {
      insertEquipment.run(item.name, item.notes);
    }
  });

  seed();

  return NextResponse.json({
    message: 'Seeded successfully',
    ingredients: INITIAL_INGREDIENTS.length,
    condiments: INITIAL_CONDIMENTS.length,
    equipment: INITIAL_EQUIPMENT.length,
  }, { status: 201 });
}

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'nutritrack.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Jony',
      weight_kg REAL DEFAULT 69.6,
      muscle_pct REAL DEFAULT 42.3,
      fat_pct REAL DEFAULT 12.0,
      tmb_kcal INTEGER DEFAULT 1900,
      goal_calories_training INTEGER DEFAULT 2400,
      goal_calories_rest INTEGER DEFAULT 2000,
      goal_protein_g INTEGER DEFAULT 150,
      goal_carbs_g INTEGER DEFAULT 235,
      goal_fat_g INTEGER DEFAULT 70,
      training_schedule TEXT DEFAULT '{"mon":"calistenia","tue":"natacion","wed":"calistenia","thu":"natacion","fri":"calistenia","sat":"descanso","sun":"descanso"}',
      kitchen_equipment TEXT DEFAULT 'Olla a presión eléctrica, Airfryer, Sartén de teflón, Horno',
      supplements TEXT DEFAULT 'Creatina 5g/día',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT,
      name TEXT NOT NULL,
      portion TEXT,
      calories REAL NOT NULL,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fat_g REAL DEFAULT 0,
      fiber_g REAL DEFAULT 0,
      source TEXT DEFAULT 'manual',
      ai_raw_response TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT,
      activity TEXT NOT NULL,
      duration_min INTEGER,
      distance_m INTEGER,
      calories_burned REAL NOT NULL,
      source TEXT DEFAULT 'manual',
      garmin_data TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      servings INTEGER DEFAULT 1,
      ingredients TEXT NOT NULL,
      steps TEXT NOT NULL,
      total_calories REAL,
      total_protein_g REAL,
      total_carbs_g REAL,
      total_fat_g REAL,
      per_serving_calories REAL,
      per_serving_protein_g REAL,
      per_serving_carbs_g REAL,
      per_serving_fat_g REAL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_notes (
      date TEXT PRIMARY KEY,
      is_training_day INTEGER DEFAULT 1,
      training_type TEXT,
      fasting_hours REAL,
      notes TEXT,
      ai_summary TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
    CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(date);
  `);

  // Ensure default profile exists
  const profile = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  if (!profile) {
    db.prepare('INSERT INTO profile (id) VALUES (1)').run();
  }
}

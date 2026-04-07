'use client';

import { useState, useEffect } from 'react';
import type { PantryItem, EquipmentItem } from '@/lib/types';

type Tab = 'ingredientes' | 'condimentos' | 'equipamiento';

const STORAGE_LABELS: Record<string, string> = {
  congelado: '🧊 Congelado',
  heladera: '❄️ Heladera',
  alacena: '🏠 Alacena',
  abierto: '📦 Abierto',
};

const STORAGE_OPTIONS = ['congelado', 'heladera', 'alacena', 'abierto'];

export default function PantryPage() {
  const [tab, setTab] = useState<Tab>('ingredientes');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/pantry').then(r => r.json()),
      fetch('/api/equipment').then(r => r.json()),
    ]).then(([p, e]) => {
      setPantryItems(p);
      setEquipment(e);
      setLoading(false);
    });
  }, []);

  const ingredients = pantryItems.filter(i => i.category === 'ingrediente');
  const condiments = pantryItems.filter(i => i.category === 'condimento');

  // Group ingredients by storage
  const grouped = ingredients.reduce((acc, item) => {
    const key = item.storage || 'alacena';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  async function handleDeletePantry(id: number) {
    await fetch(`/api/pantry?id=${id}`, { method: 'DELETE' });
    setPantryItems(prev => prev.filter(i => i.id !== id));
  }

  async function handleDeleteEquipment(id: number) {
    await fetch(`/api/equipment?id=${id}`, { method: 'DELETE' });
    setEquipment(prev => prev.filter(i => i.id !== id));
  }

  async function handleUpdateQuantity(id: number, quantity_g: number | null) {
    const res = await fetch('/api/pantry', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity_g }),
    });
    const updated = await res.json();
    setPantryItems(prev => prev.map(i => i.id === id ? updated : i));
  }

  async function handleAddItem(data: { name: string; quantity_g?: number; category: string; storage: string; notes?: string }) {
    const res = await fetch('/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const full = await fetch('/api/pantry').then(r => r.json());
      setPantryItems(full);
      setShowAdd(false);
    }
  }

  async function handleAddEquipment(data: { name: string; notes?: string }) {
    const res = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const full = await fetch('/api/equipment').then(r => r.json());
      setEquipment(full);
      setShowAdd(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-text-secondary animate-pulse">Cargando...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Despensa</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-accent text-bg-primary text-sm font-semibold px-3 py-1.5 rounded-lg"
        >
          + Agregar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-surface rounded-xl p-1">
        {([
          { key: 'ingredientes' as Tab, label: '🥩 Ingredientes', count: ingredients.length },
          { key: 'condimentos' as Tab, label: '🧂 Condimentos', count: condiments.length },
          { key: 'equipamiento' as Tab, label: '🍳 Equipo', count: equipment.length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowAdd(false); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-accent text-bg-primary' : 'text-text-secondary'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        tab === 'equipamiento'
          ? <AddEquipmentForm onAdd={handleAddEquipment} onCancel={() => setShowAdd(false)} />
          : <AddPantryForm
              category={tab === 'condimentos' ? 'condimento' : 'ingrediente'}
              onAdd={handleAddItem}
              onCancel={() => setShowAdd(false)}
            />
      )}

      {/* Content */}
      {tab === 'ingredientes' && (
        <div className="space-y-4">
          {['congelado', 'heladera', 'alacena', 'abierto'].map(storage => {
            const items = grouped[storage];
            if (!items || items.length === 0) return null;
            return (
              <div key={storage}>
                <h3 className="text-xs font-semibold text-text-secondary mb-2">
                  {STORAGE_LABELS[storage]}
                </h3>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <PantryRow
                      key={item.id}
                      item={item}
                      onDelete={handleDeletePantry}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {ingredients.length === 0 && (
            <p className="text-center text-xs text-text-secondary py-8">Sin ingredientes cargados.</p>
          )}
        </div>
      )}

      {tab === 'condimentos' && (
        <div className="space-y-1.5">
          {condiments.length === 0 ? (
            <p className="text-center text-xs text-text-secondary py-8">Sin condimentos cargados.</p>
          ) : (
            condiments.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-bg-surface-2 border border-border rounded-xl px-3 py-2.5">
                <span className="text-sm">{item.name}</span>
                <button onClick={() => handleDeletePantry(item.id)} className="text-text-secondary text-xs hover:text-burned">✕</button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'equipamiento' && (
        <div className="space-y-1.5">
          {equipment.length === 0 ? (
            <p className="text-center text-xs text-text-secondary py-8">Sin equipamiento cargado.</p>
          ) : (
            equipment.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-bg-surface-2 border border-border rounded-xl px-3 py-2.5">
                <div>
                  <span className="text-sm">{item.name}</span>
                  {item.notes && <p className="text-xs text-text-secondary">{item.notes}</p>}
                </div>
                <button onClick={() => handleDeleteEquipment(item.id)} className="text-text-secondary text-xs hover:text-burned">✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PantryRow({
  item, onDelete, onUpdateQuantity,
}: {
  item: PantryItem;
  onDelete: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(item.quantity_g?.toString() || '');

  function save() {
    const val = qty.trim() ? Number(qty) : null;
    onUpdateQuantity(item.id, val);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2 bg-bg-surface-2 border border-border rounded-xl px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <span className="text-sm">{item.name}</span>
        {item.notes && <span className="text-xs text-text-secondary ml-1">({item.notes})</span>}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              className="w-16 bg-bg-primary border border-accent rounded px-1.5 py-0.5 text-xs font-mono text-right focus:outline-none"
              autoFocus
            />
            <span className="text-xs text-text-secondary">g</span>
            <button onClick={save} className="text-accent text-xs font-semibold">✓</button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="font-mono text-xs text-accent"
          >
            {item.quantity_g ? `${item.quantity_g}g` : '—'}
          </button>
        )}
        <button onClick={() => onDelete(item.id)} className="text-text-secondary text-xs hover:text-burned">✕</button>
      </div>
    </div>
  );
}

function AddPantryForm({
  category, onAdd, onCancel,
}: {
  category: string;
  onAdd: (data: { name: string; quantity_g?: number; category: string; storage: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [storage, setStorage] = useState('alacena');

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-3 space-y-3">
      <input
        type="text"
        placeholder="Nombre del item"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full bg-bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        autoFocus
      />
      {category === 'ingrediente' && (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Cantidad (g)"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="flex-1 bg-bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          />
          <select
            value={storage}
            onChange={e => setStorage(e.target.value)}
            className="bg-bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {STORAGE_OPTIONS.map(s => (
              <option key={s} value={s}>{STORAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => name.trim() && onAdd({ name, quantity_g: qty ? Number(qty) : undefined, category, storage })}
          className="flex-1 bg-accent text-bg-primary font-semibold py-2 rounded-lg text-sm"
        >
          Agregar
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-text-secondary">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function AddEquipmentForm({
  onAdd, onCancel,
}: {
  onAdd: (data: { name: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-3 space-y-3">
      <input
        type="text"
        placeholder="Nombre del utensilio"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full bg-bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        autoFocus
      />
      <input
        type="text"
        placeholder="Notas (opcional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full bg-bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          onClick={() => name.trim() && onAdd({ name, notes: notes || undefined })}
          className="flex-1 bg-accent text-bg-primary font-semibold py-2 rounded-lg text-sm"
        >
          Agregar
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-text-secondary">
          Cancelar
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/lib/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data));
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setMessage('Guardado');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch {
      setMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return <div className="p-4 text-text-secondary animate-pulse">Cargando...</div>;
  }

  function updateField(field: keyof Profile, value: string | number) {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-bold">Configuración</h1>

      {/* Profile section */}
      <Section title="Perfil">
        <Field label="Nombre" value={profile.name} onChange={(v) => updateField('name', v)} />
        <Field label="Peso (kg)" value={profile.weight_kg} type="number" onChange={(v) => updateField('weight_kg', Number(v))} />
        <Field label="Músculo (%)" value={profile.muscle_pct} type="number" onChange={(v) => updateField('muscle_pct', Number(v))} />
        <Field label="Grasa (%)" value={profile.fat_pct} type="number" onChange={(v) => updateField('fat_pct', Number(v))} />
        <Field label="TMB (kcal)" value={profile.tmb_kcal} type="number" onChange={(v) => updateField('tmb_kcal', Number(v))} />
      </Section>

      {/* Goals section */}
      <Section title="Objetivos Diarios">
        <Field label="Calorías (entrenamiento)" value={profile.goal_calories_training} type="number" onChange={(v) => updateField('goal_calories_training', Number(v))} />
        <Field label="Calorías (descanso)" value={profile.goal_calories_rest} type="number" onChange={(v) => updateField('goal_calories_rest', Number(v))} />
        <Field label="Proteína (g)" value={profile.goal_protein_g} type="number" onChange={(v) => updateField('goal_protein_g', Number(v))} />
        <Field label="Carbohidratos (g)" value={profile.goal_carbs_g} type="number" onChange={(v) => updateField('goal_carbs_g', Number(v))} />
        <Field label="Grasas (g)" value={profile.goal_fat_g} type="number" onChange={(v) => updateField('goal_fat_g', Number(v))} />
      </Section>

      {/* Equipment */}
      <Section title="Equipamiento">
        <Field label="Cocina" value={profile.kitchen_equipment} onChange={(v) => updateField('kitchen_equipment', v)} />
        <Field label="Suplementos" value={profile.supplements} onChange={(v) => updateField('supplements', v)} />
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-accent text-bg-primary font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        {message && (
          <span className={`text-sm ${message === 'Guardado' ? 'text-accent' : 'text-burned'}`}>{message}</span>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
      <div className="bg-bg-surface border border-border rounded-xl p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function Field({
  label, value, type = 'text', onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-text-secondary shrink-0">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-right font-mono w-32 focus:outline-none focus:border-accent"
      />
    </div>
  );
}

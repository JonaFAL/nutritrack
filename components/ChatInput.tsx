'use client';

import { useState, useRef } from 'react';
import type { ChatMode } from '@/lib/types';

interface ChatInputProps {
  onSend: (message: string, mode: ChatMode, imageBase64?: string, imageMimeType?: string) => void;
  loading: boolean;
}

const MODES: { key: ChatMode; icon: string; label: string }[] = [
  { key: 'meal', icon: '🍽', label: 'Comida' },
  { key: 'exercise', icon: '🏋️', label: 'Ejercicio' },
  { key: 'recipe', icon: '👨‍🍳', label: 'Receta' },
];

export default function ChatInput({ onSend, loading }: ChatInputProps) {
  const [mode, setMode] = useState<ChatMode>('meal');
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result.split(',')[1]);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  }

  function handleSend() {
    if (!message.trim() && !imageBase64) return;
    onSend(message, mode, imageBase64 || undefined, imageMimeType || undefined);
    setMessage('');
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="bg-bg-surface border-t border-border p-3">
      {/* Mode selector */}
      <div className="flex gap-2 mb-3">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === m.key
                ? 'bg-accent text-bg-primary'
                : 'bg-bg-surface-2 text-text-secondary border border-border'
            }`}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover" />
          <button
            onClick={() => { setImagePreview(null); setImageBase64(null); }}
            className="absolute -top-1 -right-1 bg-burned text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        {mode === 'meal' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImage}
              className="hidden"
              id="photo-input"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-bg-surface-2 border border-border text-lg"
            >
              📷
            </button>
          </>
        )}

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            mode === 'meal' ? '520g curry de pollo con arroz...'
            : mode === 'exercise' ? 'Natación 4200m, Garmin marcó 817kcal...'
            : 'Tengo pollo, arroz y brócoli...'
          }
          rows={1}
          className="flex-1 bg-bg-surface-2 border border-border rounded-lg p-2.5 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-accent"
        />

        <button
          onClick={handleSend}
          disabled={loading || (!message.trim() && !imageBase64)}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-accent text-bg-primary font-bold disabled:opacity-30 transition-opacity"
        >
          {loading ? (
            <span className="animate-spin text-sm">⏳</span>
          ) : (
            '→'
          )}
        </button>
      </div>
    </div>
  );
}

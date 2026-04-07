'use client';

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

function MacroBar({ label, current, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = Math.min((current / goal) * 100, 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono">
          <span style={{ color }}>{Math.round(current)}</span>
          <span className="text-text-secondary"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fat: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
}

export default function MacroBars({ protein, carbs, fat, goalProtein, goalCarbs, goalFat }: MacroBarsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <MacroBar label="Proteína" current={protein} goal={goalProtein} color="#4DA6FF" />
      <MacroBar label="Carbos" current={carbs} goal={goalCarbs} color="#FF9F43" />
      <MacroBar label="Grasas" current={fat} goal={goalFat} color="#C4F538" />
    </div>
  );
}

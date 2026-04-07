'use client';

interface CalorieRingProps {
  consumed: number;
  burned: number;
  goal: number;
}

export default function CalorieRing({ consumed, burned, goal }: CalorieRingProps) {
  const net = consumed - burned;
  const pct = Math.min(net / goal, 1.5);
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;
  const size = (radius + stroke) * 2;

  const isOver = net > goal;
  const ringColor = isOver ? '#FF4D4D' : '#C4F538';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#2A2A2A"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              ['--ring-circumference' as string]: circumference,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono" style={{ color: ringColor }}>
            {Math.round(net)}
          </span>
          <span className="text-xs text-text-secondary">/ {goal} kcal</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 text-xs">
        <div className="flex flex-col items-center">
          <span className="text-text-secondary">Ingeridas</span>
          <span className="font-mono font-semibold text-text-primary">{Math.round(consumed)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-text-secondary">Quemadas</span>
          <span className="font-mono font-semibold text-burned">{Math.round(burned)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-text-secondary">Neto</span>
          <span className="font-mono font-semibold" style={{ color: ringColor }}>{Math.round(net)}</span>
        </div>
      </div>
    </div>
  );
}

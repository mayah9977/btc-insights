'use client';

type Props = {
  score: number;
  progress?: number; // 0~1 (cooldown)
  mode?: 'normal' | 'cooldown';
  highlight?: boolean; // EXTREME
  failureProb?: number; // 0~1
  vip?: boolean;
};

export default function AIScoreRing({
  score,
  progress = 1,
  mode = 'normal',
  highlight = false,
  failureProb = 0,
  vip = false,
}: Props) {
  const safeScore = Number.isFinite(score) ? score : 0;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const scoreOffset =
    circumference - (safeScore / 100) * circumference;
  const cooldownOffset =
    circumference - progress * circumference;

  // 🔥 Danger Zone (EXTREME + 실패확률 높음)
  const danger =
    highlight && failureProb >= 0.6 && vip;

  // 🎯 링 색상
  const strokeColor =
    mode === 'cooldown'
      ? danger
        ? '#dc2626' // danger red
        : highlight
        ? '#ef4444'
        : '#facc15'
      : vip
      ? '#22c55e'
      : '#38bdf8';

  // ⏱️ 실패확률 → 애니메이션 속도 (0.4s ~ 1.2s)
  const tickSpeed = vip
    ? Math.max(0.4, 1.2 - failureProb)
    : 1.2;

  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      className={mode === 'cooldown' ? 'ring-tick' : ''}
    >
      {/* Background */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke="#2a2a2a"
        strokeWidth="10"
        fill="none"
      />

      {/* EXTREME Danger Wave (VIP only) */}
      {danger && (
        <circle
          cx="60"
          cy="60"
          r={radius + 8}
          stroke="#dc2626"
          strokeWidth="3"
          fill="none"
          className="danger-wave"
        />
      )}

      {/* Main Ring */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke={strokeColor}
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={
          mode === 'cooldown' ? cooldownOffset : scoreOffset
        }
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        className={mode === 'cooldown' ? 'ring-main' : ''}
      />

      {/* Text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize="20"
        fontWeight="bold"
      >
        {mode === 'cooldown'
          ? `${Math.ceil(progress * 100)}%`
          : `${safeScore}%`}
      </text>

      <style>{`
        .ring-tick .ring-main {
          animation: tickPulse ${tickSpeed}s infinite linear;
        }

        @keyframes tickPulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .danger-wave {
          animation: dangerWave 0.9s infinite ease-out;
        }

        @keyframes dangerWave {
          0% {
            stroke-opacity: 0.8;
            transform: scale(1);
            transform-origin: center;
          }
          100% {
            stroke-opacity: 0;
            transform: scale(1.35);
            transform-origin: center;
          }
        }
      `}</style>
    </svg>
  );
}

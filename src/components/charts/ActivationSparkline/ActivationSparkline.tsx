import { cn } from '@/lib/utils';
import styles from './ActivationSparkline.module.css';

export interface ActivationSparklineProps {
  data: number[];
  maxActivation: number;
  className?: string;
  width: number;
  height: number;
}

export const ActivationSparkline = ({
  data,
  maxActivation,
  className,
  width,
  height,
}: ActivationSparklineProps) => {
  if (!data.length || !maxActivation) {
    return (
      <svg className={cn(styles.sparkline, className)} width={width} height={height} role="img" aria-label="Activation sparkline">
        <rect width="100%" height="100%" fill="var(--color-surface)" rx="4" />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="var(--color-text-subtle)" fontSize="10" fontFamily="JetBrains Mono">--</text>
      </svg>
    );
  }

  const maxVal = Math.max(...data);
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - (v / maxVal) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className={cn(styles.sparkline, className)} width={width} height={height} role="img" aria-label="Activation sparkline">
      <rect width="100%" height="100%" fill="var(--color-surface)" rx="4" />
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
    </svg>
  );
};
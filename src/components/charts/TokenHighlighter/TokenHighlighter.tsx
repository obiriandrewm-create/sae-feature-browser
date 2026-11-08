import { cn } from '@/lib/utils';
import styles from './TokenHighlighter.module.css';

export interface TokenHighlighterProps {
  tokens: string[];
  activations: number[];
  className?: string;
  maxTokens?: number;
  maxActivation?: number;
}

export const TokenHighlighter = ({
  tokens,
  activations,
  className,
  maxTokens = 5,
  maxActivation = 1,
}: TokenHighlighterProps) => {
  if (!tokens.length) {
    return (
      <div className={cn(styles.container, className)} role="img" aria-label="Token activations">
        <span className={styles.token}>--</span>
      </div>
    );
  }

  const maxAct = maxActivation || Math.max(...activations);
  const displayTokens = tokens.slice(0, maxTokens);
  const displayActivations = activations.slice(0, maxTokens);

  const opacityForActivation = (act: number) => {
    const normalized = maxAct > 0 ? Math.min(act / maxAct, 1) : 0;
    const baseOpacity = 0.3 + normalized * 0.7;
    return Math.round(baseOpacity * 100) / 100;
  };

  return (
    <div className={cn(styles.container, className)} role="img" aria-label="Token activations">
      {displayTokens.map((token, i) => {
        const act = displayActivations[i] ?? 0;
        const opacity = opacityForActivation(act);
        const r = Math.round(255 * opacity);
        const g = Math.round(61 * opacity);
        const b = Math.round(0 * opacity);
        return (
          <span
            key={i}
            className={styles.token}
            style={{
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
              opacity: opacity,
            }}
            title={`${token}: ${act.toFixed(3)}`}
          >
            {token}
          </span>
        );
      })}
    </div>
  );
};
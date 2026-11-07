import * as d3 from 'd3';
import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import styles from './TokenHighlighter.module.css';

export interface TokenHighlighterProps {
  tokens: string[];
  activations: number[];
  maxTokens?: number;
  className?: string;
  maxActivation?: number;
  showValues?: boolean;
  ariaLabel?: string;
}

export const TokenHighlighter = ({
  tokens,
  activations,
  maxTokens = 8,
  className,
  maxActivation,
  showValues = false,
  ariaLabel = 'Token activation highlights',
}: TokenHighlighterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const maxAct = useMemo(
    () => maxActivation ?? Math.max(...activations, 0.001),
    [maxActivation, activations]
  );

  const displayTokens = useMemo(() => {
    const count = Math.min(maxTokens, tokens.length);
    return tokens.slice(0, count);
  }, [tokens, maxTokens]);

  const displayActivations = useMemo(() => {
    const count = Math.min(maxTokens, activations.length);
    return activations.slice(0, count);
  }, [activations, maxTokens]);

  const colorScale = useMemo(
    () =>
      d3
        .scaleSequential(d3.interpolateRdYlBu)
        .domain([0, maxAct])
        .clamp(true),
    [maxAct]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const container = d3.select(containerRef.current);
    container.selectAll('*').remove();

    const tokenElements = container
      .selectAll<HTMLElement, { token: string; activation: number; index: number }>(
        '.token'
      )
      .data(
        displayTokens.map((token, i) => ({
          token,
          activation: displayActivations[i] ?? 0,
          index: i,
        }))
      );

    tokenElements
      .join('span')
      .attr('class', 'token')
      .style('background-color', (d) => colorScale(d.activation))
      .style('color', (d) => {
        const rgb = d3.color(colorScale(d.activation))!;
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5 ? '#000' : '#fff';
      })
      .style('padding', '2px 6px')
      .style('margin', '2px')
      .style('border-radius', '4px')
      .style('font-family', 'var(--font-family-mono)')
      .style('font-size', 'var(--font-size-sm)')
      .style('display', 'inline-flex')
      .style('align-items', 'center')
      .style('gap', '4px')
      .style('box-shadow', '0 1px 2px rgba(0,0,0,0.1)')
      .style('transition', 'transform 0.15s ease, box-shadow 0.15s ease')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .style('transform', 'scale(1.05)')
          .style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)')
          .style('z-index', 10);
        if (showValues) {
          d3.select(this).append('span').attr('class', 'token-value').text(` ${d.activation.toFixed(3)}`);
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .style('transform', 'scale(1)')
          .style('box-shadow', '0 1px 2px rgba(0,0,0,0.1)')
          .style('z-index', 'auto');
        d3.select(this).select('.token-value').remove();
      })
      .text((d) => d.token);

    const moreCount = tokens.length - maxTokens;
    if (moreCount > 0) {
      container
        .append('span')
        .attr('class', 'token-more')
        .style('color', 'var(--color-foreground-tertiary)')
        .style('font-size', 'var(--font-size-sm)')
        .style('margin-left', '4px')
        .text(`+${moreCount} more`);
    }
  }, [displayTokens, displayActivations, maxAct, colorScale, maxTokens, tokens.length, showValues]);

  return (
    <div
      ref={containerRef}
      className={cn(styles.container, className)}
      role="list"
      aria-label={ariaLabel}
    />
  );
};

TokenHighlighter.displayName = 'TokenHighlighter';
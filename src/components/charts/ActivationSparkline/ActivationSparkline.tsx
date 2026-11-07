import * as d3 from 'd3';
import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import styles from './ActivationSparkline.module.css';

export interface ActivationSparklineProps {
  data: number[];
  maxActivation: number;
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  showTooltip?: boolean;
  ariaLabel?: string;
}

export const ActivationSparkline = ({
  data,
  maxActivation,
  width = 120,
  height = 32,
  className,
  color,
  showTooltip = true,
  ariaLabel = 'Activation sparkline',
}: ActivationSparklineProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const xScale = useMemo(
    () => d3.scaleLinear().domain([0, data.length - 1]).range([0, width]),
    [data.length, width]
  );

  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, maxActivation]).range([height, 0]),
    [maxActivation, height]
  );

  const line = useMemo(
    () =>
      d3
        .line<number>()
        .x((_, i) => xScale(i))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX),
    [xScale, yScale]
  );

  const area = useMemo(
    () =>
      d3
        .area<number>()
        .x((_, i) => xScale(i))
        .y0(height)
        .y1((d) => yScale(d))
        .curve(d3.curveMonotoneX),
    [xScale, yScale, height]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const path = svg.selectAll<SVGPathElement, number>('.sparkline-path').data([data]);

    path
      .join('path')
      .attr('class', 'sparkline-path')
      .attr('d', area)
      .attr('fill', color || 'var(--color-brand-primary)')
      .attr('fill-opacity', 0.15);

    const linePath = svg.selectAll<SVGPathElement, number>('.sparkline-line').data([data]);

    linePath
      .join('path')
      .attr('class', 'sparkline-line')
      .attr('d', line)
      .attr('stroke', color || 'var(--color-brand-primary)')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    const maxIndex = data.indexOf(Math.max(...data));
    const maxPoint = svg.selectAll<SVGCircleElement, number>('.sparkline-max').data(maxIndex >= 0 ? [data[maxIndex]] : []);

    maxPoint
      .join('circle')
      .attr('class', 'sparkline-max')
      .attr('cx', maxIndex >= 0 ? xScale(maxIndex) : 0)
      .attr('cy', maxIndex >= 0 ? yScale(data[maxIndex]) : 0)
      .attr('r', 3)
      .attr('fill', color || 'var(--color-brand-primary)')
      .attr('stroke', 'var(--color-background-primary)')
      .attr('stroke-width', 2);
  }, [data, maxActivation, width, height, color, xScale, yScale, line, area]);

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || !tooltipRef.current) return;

    const rect = svgRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const index = Math.round(xScale.invert(x));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
    const value = data[clampedIndex];

    tooltipRef.current.style.left = `${x + 8}px`;
    tooltipRef.current.style.top = `${yScale(value) - 8}px`;
    tooltipRef.current.textContent = `${value.toFixed(3)}`;
    tooltipRef.current.style.opacity = '1';
  };

  const handleMouseLeave = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = '0';
    }
  };

  return (
    <div className={cn(styles.container, className)} role="img" aria-label={ariaLabel}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color || 'var(--color-brand-primary)'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color || 'var(--color-brand-primary)'} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={styles.tooltip}
          style={{ opacity: 0, pointerEvents: 'none' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

ActivationSparkline.displayName = 'ActivationSparkline';
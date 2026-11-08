import * as d3 from 'd3';
import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import styles from './ActivationHistogram.module.css';

export interface ActivationHistogramProps {
  data: number[];
  maxActivation: number;
  bins?: number;
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  showAxes?: boolean;
  showTooltip?: boolean;
  showMeanLine?: boolean;
  showPercentileLines?: boolean;
  ariaLabel?: string;
  onBinClick?: (binIndex: number, binRange: [number, number], count: number) => void;
}

export const ActivationHistogram = ({
  data,
  maxActivation,
  bins = 50,
  width = 300,
  height = 150,
  className,
  color,
  showAxes = true,
  showTooltip = true,
  showMeanLine = true,
  showPercentileLines = false,
  ariaLabel = 'Activation histogram',
  onBinClick,
}: ActivationHistogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const histogramData = useMemo(() => {
    if (!data.length || maxActivation <= 0) return [];
    const thresholds = d3
      .range(bins + 1)
      .map((i) => (i / bins) * maxActivation);
    const histogram = d3.histogram().domain([0, maxActivation]).thresholds(thresholds);
    return histogram(data);
  }, [data, maxActivation, bins]);

  const totalCount = useMemo(
    () => histogramData.reduce((sum, bin) => sum + bin.length, 0),
    [histogramData]
  );

  const maxCount = useMemo(
    () => Math.max(1, ...histogramData.map((bin) => bin.length)),
    [histogramData]
  );

  const mean = useMemo(
    () => data.length > 0 ? data.reduce((sum, v) => sum + v, 0) / data.length : 0,
    [data]
  );

  const percentiles = useMemo(() => {
    if (!data.length) return { p50: 0, p90: 0, p95: 0, p99: 0 };
    const sorted = [...data].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p90: sorted[Math.floor(sorted.length * 0.9)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
    };
  }, [data]);

  const xScale = useMemo(
    () => d3.scaleLinear().domain([0, maxActivation]).range([0, width]),
    [maxActivation, width]
  );

  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, maxCount]).range([height, 0]),
    [maxCount, height]
  );

  const binWidth = width / bins;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (showAxes) {
      const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.2f'));
      const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('.2s'));

      svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('fill', 'var(--color-foreground-tertiary)');

      svg
        .append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('fill', 'var(--color-foreground-tertiary)');

      svg
        .selectAll('.domain')
        .attr('stroke', 'var(--color-border-primary)')
        .attr('stroke-width', 1);

      svg
        .selectAll('.tick line')
        .attr('stroke', 'var(--color-border-primary)')
        .attr('stroke-width', 0.5);
    }

    const barColor = color || 'var(--color-brand-primary)';

    const bars = svg
      .selectAll<SVGRectElement, d3.Bin<number, number>>('.histogram-bar')
      .data(histogramData);

    bars
      .join('rect')
      .attr('class', 'histogram-bar')
      .attr('x', (d) => xScale(d.x0 ?? 0))
      .attr('y', (d) => yScale(d.length))
      .attr('width', Math.max(1, binWidth - 1))
      .attr('height', (d) => height - yScale(d.length))
      .attr('fill', barColor)
      .attr('fill-opacity', 0.7)
      .attr('rx', 1)
      .style('cursor', onBinClick ? 'pointer' : 'default')
      .on('mouseenter', function (_event, d) {
        d3.select(this).attr('fill-opacity', 1).attr('stroke', 'var(--color-foreground-inverse)').attr('stroke-width', 1);

        if (showTooltip && tooltipRef.current && d.x0 !== undefined && d.x1 !== undefined) {
          const binStart = d.x0.toFixed(3);
          const binEnd = d.x1.toFixed(3);
          const percentage = totalCount > 0 ? ((d.length / totalCount) * 100).toFixed(1) : '0';
          tooltipRef.current.innerHTML = `
            <strong>${binStart} – ${binEnd}</strong><br/>
            Count: ${d.length.toLocaleString()} (${percentage}%)
          `;
          const rect = (this as SVGRectElement).getBoundingClientRect();
          const svgRect = svgRef.current!.getBoundingClientRect();
          tooltipRef.current.style.left = `${rect.left - svgRect.left + rect.width / 2}px`;
          tooltipRef.current.style.top = `${rect.top - svgRect.top - 8}px`;
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.style.transform = 'translateX(-50%)';
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.7).attr('stroke', 'none');
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
      })
      .on('click', function (_event, d) {
        if (onBinClick && d.x0 !== undefined && d.x1 !== undefined) {
          const binIndex = histogramData.indexOf(d);
          onBinClick(binIndex, [d.x0, d.x1], d.length);
        }
      });

    if (showMeanLine) {
      svg
        .append('line')
        .attr('class', 'mean-line')
        .attr('x1', xScale(mean))
        .attr('x2', xScale(mean))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'var(--color-semantic-warning)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.8);
    }

    if (showPercentileLines) {
      const percentileLines = [
        { key: 'p50', label: 'P50', color: 'var(--color-semantic-info)' },
        { key: 'p90', label: 'P90', color: 'var(--color-semantic-success)' },
        { key: 'p95', label: 'P95', color: 'var(--color-semantic-warning)' },
        { key: 'p99', label: 'P99', color: 'var(--color-semantic-error)' },
      ];

      percentileLines.forEach((p) => {
        const value = percentiles[p.key as keyof typeof percentiles];
        svg
          .append('line')
          .attr('class', `percentile-line ${p.key}`)
          .attr('x1', xScale(value))
          .attr('x2', xScale(value))
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', p.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.6);
      });
    }
  }, [
    histogramData,
    width,
    height,
    xScale,
    yScale,
    binWidth,
    showAxes,
    showTooltip,
    showMeanLine,
    showPercentileLines,
    color,
    mean,
    percentiles,
    totalCount,
    onBinClick,
  ]);

  return (
    <div className={cn(styles.container, className)} role="img" aria-label={ariaLabel}>
      <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" />
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={styles.tooltip}
          style={{ opacity: 0, pointerEvents: 'none', transform: 'translateX(-50%)' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

ActivationHistogram.displayName = 'ActivationHistogram';
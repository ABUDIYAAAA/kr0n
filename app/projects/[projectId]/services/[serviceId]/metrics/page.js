'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronDown,
  Minus,
  Rocket,
  ExternalLink,
} from 'lucide-react';
import {
  MOCK_SERVICE,
  MOCK_METRICS,
  DEPLOYMENT_MARKERS,
  MOCK_TRACES,
} from '@/lib/observability-data';

// ─── Mini SVG chart ────────────────────────────────────────────────
function SparkChart({ data, width = 600, height = 120, color = '#fff', showDeployments = false, className = '' }) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  // Deployment marker positions
  const deployMarkers = showDeployments ? DEPLOYMENT_MARKERS.map((m) => {
    const timeRange = data[data.length - 1].time - data[0].time;
    const relativePos = (m.time - data[0].time) / timeRange;
    if (relativePos < 0 || relativePos > 1) return null;
    return { ...m, x: relativePos * width };
  }).filter(Boolean) : [];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} preserveAspectRatio='none'>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor={color} stopOpacity='0.12' />
          <stop offset='100%' stopColor={color} stopOpacity='0' />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={pathD} fill='none' stroke={color} strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
      {/* Deployment markers */}
      {deployMarkers.map((m, i) => (
        <g key={i}>
          <line x1={m.x} y1={0} x2={m.x} y2={height} stroke='#858C95' strokeWidth='1' strokeDasharray='3,3' opacity='0.5' />
          <circle cx={m.x} cy={4} r={3} fill='#858C95' stroke='#111419' strokeWidth='1.5' />
        </g>
      ))}
    </svg>
  );
}

const TIME_RANGES = ['1h', '6h', '24h', '7d', '30d'];

export default function MetricsPage({ params }) {
  const { projectId, serviceId } = use(params);

  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('metrics');
  const [hoveredDeployment, setHoveredDeployment] = useState(null);

  return (
    <div className='flex flex-col h-full bg-kr0n-canvas text-kr0n-text overflow-auto'>
      {/* ─── Service Context Header ─── */}
      <div className='h-12 border-b border-kr0n-line bg-kr0n-canvas-raised/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0'>
        <div className='flex items-center gap-3 text-xs font-mono'>
          <Link
            href={`/projects/${projectId}`}
            className='flex items-center gap-1 text-kr0n-muted hover:text-white transition-colors uppercase tracking-wider'
          >
            <ArrowLeft size={12} />
            <span className='hidden sm:inline'>Project</span>
          </Link>
          <span className='text-kr0n-faint'>/</span>
          <span className='text-white font-bold uppercase tracking-wider'>
            {MOCK_SERVICE.serviceName}
          </span>
          <span className='px-1.5 py-0.5 border border-kr0n-line text-[10px] text-kr0n-faint uppercase'>
            {MOCK_SERVICE.environment}
          </span>
        </div>

        <nav className='hidden md:flex items-center gap-0 text-[11px] font-mono uppercase tracking-wider'>
          {[
            { label: 'Overview', href: `/projects/${projectId}/services/${serviceId}` },
            { label: 'Deployments', href: `/projects/${projectId}/services/${serviceId}/deployments` },
            { label: 'Logs', href: `/projects/${projectId}/services/${serviceId}/logs` },
            { label: 'Metrics', href: `/projects/${projectId}/services/${serviceId}/metrics`, active: true },
            { label: 'Settings', href: `/projects/${projectId}/services/${serviceId}/settings` },
          ].map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`px-3 py-3 border-b-2 transition-colors ${
                tab.active
                  ? 'border-white text-white'
                  : 'border-transparent text-kr0n-faint hover:text-kr0n-muted'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ─── Metrics Header ─── */}
      <div className='px-4 sm:px-6 lg:px-8 py-6 border-b border-kr0n-line-soft bg-kr0n-black/30 shrink-0'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div>
              <h1 className='text-xl font-bold text-white tracking-wide'>Metrics</h1>
              <div className='flex items-center gap-3 mt-2 text-xs font-mono text-kr0n-muted'>
                <span>Last deployment · {MOCK_SERVICE.currentDeployment.relativeTime}</span>
                <span className='text-kr0n-faint'>·</span>
                <div className='flex items-center gap-1'>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                  <span className='text-emerald-400'>Healthy</span>
                </div>
              </div>
            </div>

            {/* Time range selector + Metrics/Traces toggle */}
            <div className='flex items-center gap-4'>
              {/* Tab toggle */}
              <div className='flex items-center border border-kr0n-line'>
                {['metrics', 'traces'].map((tab) => (
                  <button
                    key={tab}
                    type='button'
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      activeTab === tab
                        ? 'bg-white/[0.08] text-white'
                        : 'text-kr0n-faint hover:text-kr0n-muted'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Time range */}
              {activeTab === 'metrics' && (
                <div className='flex items-center border border-kr0n-line'>
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range}
                      type='button'
                      onClick={() => setTimeRange(range)}
                      className={`px-2.5 py-1.5 text-[11px] font-mono transition-colors ${
                        timeRange === range
                          ? 'bg-white/[0.08] text-white'
                          : 'text-kr0n-faint hover:text-kr0n-muted'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'metrics' ? (
        <div className='px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
          <div className='max-w-6xl mx-auto space-y-6'>
            {/* ─── Hero Metric: Requests ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='border border-kr0n-line bg-kr0n-surface'
            >
              <div className='px-5 pt-5 pb-3 flex items-start justify-between'>
                <div>
                  <div className='text-[10px] font-mono text-kr0n-faint uppercase tracking-widest'>
                    {MOCK_METRICS.requests.label}
                  </div>
                  <div className='flex items-baseline gap-3 mt-1'>
                    <span className='text-3xl font-bold text-white tabular-nums'>
                      {MOCK_METRICS.requests.total}
                    </span>
                    <span className='text-xs font-mono text-kr0n-muted'>
                      {MOCK_METRICS.requests.unit}
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-1 text-xs font-mono'>
                  <TrendingUp size={12} className='text-emerald-400' />
                  <span className='text-emerald-400'>{MOCK_METRICS.requests.change}</span>
                </div>
              </div>
              <div className='px-2 pb-2'>
                <SparkChart
                  data={MOCK_METRICS.requests.data}
                  height={140}
                  color='#F3F4F6'
                  showDeployments
                  className='h-[140px]'
                />
              </div>
              {/* Deployment markers legend */}
              <div className='px-5 pb-4 flex items-center gap-4 text-[10px] font-mono text-kr0n-faint'>
                {DEPLOYMENT_MARKERS.slice(0, 3).map((m, i) => (
                  <div
                    key={i}
                    className='flex items-center gap-1.5 hover:text-kr0n-muted cursor-default'
                    onMouseEnter={() => setHoveredDeployment(m)}
                    onMouseLeave={() => setHoveredDeployment(null)}
                  >
                    <Rocket size={9} />
                    <span>{m.version}</span>
                    <span className='text-kr0n-line-strong'>·</span>
                    <span>{m.commit}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── Secondary Row: Latency + Errors ─── */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {[MOCK_METRICS.latency, MOCK_METRICS.errors].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                  className='border border-kr0n-line bg-kr0n-surface'
                >
                  <div className='px-5 pt-5 pb-3 flex items-start justify-between'>
                    <div>
                      <div className='text-[10px] font-mono text-kr0n-faint uppercase tracking-widest'>
                        {metric.label}
                      </div>
                      <div className='flex items-baseline gap-2 mt-1'>
                        <span className='text-2xl font-bold text-white tabular-nums'>
                          {metric.total}
                        </span>
                        {metric.sublabel && (
                          <span className='text-[10px] font-mono text-kr0n-faint uppercase'>
                            {metric.sublabel}
                          </span>
                        )}
                      </div>
                      {metric.p99 && (
                        <div className='text-[11px] font-mono text-kr0n-muted mt-1'>
                          p99: {metric.p99}
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-1 text-xs font-mono'>
                      {metric.changeDirection === 'down' ? (
                        <TrendingDown size={12} className='text-emerald-400' />
                      ) : (
                        <TrendingUp size={12} className={metric.label === 'Latency' ? 'text-amber-400' : 'text-emerald-400'} />
                      )}
                      <span className={metric.changeDirection === 'down' ? 'text-emerald-400' : metric.label === 'Latency' ? 'text-amber-400' : 'text-emerald-400'}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className='px-2 pb-3'>
                    <SparkChart
                      data={metric.data}
                      height={80}
                      color={metric.label === 'Errors' ? '#ef4444' : '#F3F4F6'}
                      className='h-[80px]'
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ─── Infrastructure Row: CPU, Memory, Network ─── */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {[MOCK_METRICS.cpu, MOCK_METRICS.memory, MOCK_METRICS.network].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                  className='border border-kr0n-line bg-kr0n-surface'
                >
                  <div className='px-4 pt-4 pb-2 flex items-start justify-between'>
                    <div>
                      <div className='text-[10px] font-mono text-kr0n-faint uppercase tracking-widest'>
                        {metric.label}
                      </div>
                      <div className='flex items-baseline gap-2 mt-1'>
                        <span className='text-lg font-bold text-white tabular-nums'>
                          {metric.total}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-1 text-[11px] font-mono'>
                      {metric.changeDirection === 'down' ? (
                        <TrendingDown size={10} className='text-emerald-400' />
                      ) : (
                        <TrendingUp size={10} className='text-kr0n-muted' />
                      )}
                      <span className={metric.changeDirection === 'down' ? 'text-emerald-400' : 'text-kr0n-muted'}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className='px-1 pb-2'>
                    <SparkChart
                      data={metric.data}
                      height={60}
                      color='#858C95'
                      className='h-[60px]'
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ─── Traces Tab ─── */
        <div className='px-4 sm:px-6 lg:px-8 py-6'>
          <div className='max-w-6xl mx-auto space-y-4'>
            <div className='text-[10px] font-mono text-kr0n-faint uppercase tracking-widest'>
              Recent Traces
            </div>

            <div className='border border-kr0n-line bg-kr0n-surface divide-y divide-kr0n-line-soft'>
              {MOCK_TRACES.map((trace, i) => (
                <motion.div
                  key={trace.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className='px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.015] transition-colors cursor-default group'
                >
                  <div className='flex items-start gap-3'>
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      trace.status === 'ok' ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <div className='text-xs font-mono text-white font-medium'>
                        {trace.name}
                      </div>
                      <div className='flex items-center gap-2 mt-1 text-[10px] font-mono text-kr0n-faint'>
                        <span>{trace.spans} spans</span>
                        <span className='text-kr0n-line-strong'>·</span>
                        <span>{trace.services.join(' → ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 text-xs font-mono'>
                    <span className='text-kr0n-faint'>{trace.timestamp}</span>
                    <span className={`font-bold tabular-nums ${
                      trace.status === 'ok' ? 'text-white' : 'text-red-400'
                    }`}>
                      {trace.duration}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className='text-[10px] font-mono text-kr0n-faint text-center py-3'>
              Showing recent traces · {MOCK_TRACES.length} captured
            </div>
          </div>
        </div>
      )}

      {/* ─── Deployment marker tooltip ─── */}
      {hoveredDeployment && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-kr0n-surface border border-kr0n-line px-4 py-3 shadow-xl'>
          <div className='flex items-center gap-3 text-xs font-mono'>
            <Rocket size={12} className='text-kr0n-faint' />
            <span className='text-white font-bold'>{hoveredDeployment.version}</span>
            <span className='text-kr0n-faint'>{hoveredDeployment.commit}</span>
            <span className='text-kr0n-line-strong'>·</span>
            <span className='text-emerald-400'>{hoveredDeployment.status}</span>
            <span className='text-kr0n-line-strong'>·</span>
            <span className='text-kr0n-faint'>by {hoveredDeployment.author}</span>
          </div>
        </div>
      )}
    </div>
  );
}

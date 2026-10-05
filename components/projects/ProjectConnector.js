'use client';

/**
 * ProjectConnector — SVG connector line between related project cards.
 * Renders an ultra-refined, UI-UX Pro Max luminous cubic Bézier rail with a
 * flowing glow beam, traveling photon particle, pulsing anchor portals,
 * and technical status telemetry.
 */
export default function ProjectConnector({
  fromCard,
  toCard,
  fromHeight = 120,
  toHeight = 120,
  isActive,
  label = 'REPLICATION RAIL',
}) {
  const CARD_W = 268;

  // Compute centers
  const fromCenterX = fromCard._x + CARD_W / 2;
  const fromCenterY = fromCard._y + fromHeight / 2;
  const toCenterX = toCard._x + CARD_W / 2;
  const toCenterY = toCard._y + toHeight / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  let x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y;

  // Determine optimal edge anchor points based on relative orientation
  if (Math.abs(dy) >= Math.abs(dx)) {
    // Primarily vertical relationship
    if (dy > 0) {
      // from is above to
      x1 = fromCenterX;
      y1 = fromCard._y + fromHeight;
      x2 = toCenterX;
      y2 = toCard._y;
      const midY = (y1 + y2) / 2;
      cp1x = x1;
      cp1y = midY;
      cp2x = x2;
      cp2y = midY;
    } else {
      // from is below to
      x1 = fromCenterX;
      y1 = fromCard._y;
      x2 = toCenterX;
      y2 = toCard._y + toHeight;
      const midY = (y1 + y2) / 2;
      cp1x = x1;
      cp1y = midY;
      cp2x = x2;
      cp2y = midY;
    }
  } else {
    // Primarily horizontal relationship
    if (dx > 0) {
      // from is left of to
      x1 = fromCard._x + CARD_W;
      y1 = fromCenterY;
      x2 = toCard._x;
      y2 = toCenterY;
      const midX = (x1 + x2) / 2;
      cp1x = midX;
      cp1y = y1;
      cp2x = midX;
      cp2y = y2;
    } else {
      // from is right of to
      x1 = fromCard._x;
      y1 = fromCenterY;
      x2 = toCard._x + CARD_W;
      y2 = toCenterY;
      const midX = (x1 + x2) / 2;
      cp1x = midX;
      cp1y = y1;
      cp2x = midX;
      cp2y = y2;
    }
  }

  const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const idPrefix = `${fromCard.id}-${toCard.id}`.replace(/[^a-zA-Z0-9]/g, '_');

  return (
    <g className='transition-opacity duration-300'>
      <defs>
        {/* Glow blur filter for diffuse light dispersion */}
        <filter id={`${idPrefix}-glow`} x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='4' result='blur' />
          <feMerge>
            <feMergeNode in='blur' />
            <feMergeNode in='blur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>

        {/* Linear gradient for flowing photon tail */}
        <linearGradient id={`${idPrefix}-flowGrad`} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#ffffff' stopOpacity='0' />
          <stop offset='60%' stopColor='#10b981' stopOpacity='0.8' />
          <stop offset='100%' stopColor='#ffffff' stopOpacity='1' />
        </linearGradient>
      </defs>

      {/* ─── Layer 0: Dark backplate channel ─── */}
      <path
        d={d}
        fill='none'
        stroke='#090B0E'
        strokeWidth={isActive ? 7 : 5}
        strokeLinecap='round'
      />

      {/* ─── Layer 1: Structural track guide (subtle dashed rail) ─── */}
      <path
        d={d}
        fill='none'
        stroke={isActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.08)'}
        strokeWidth={1}
        strokeDasharray='3 5'
      />

      {/* ─── Layer 2: Wide diffuse radiant glow beam (Hardware-accelerated) ─── */}
      <path
        d={d}
        fill='none'
        stroke={isActive ? 'rgba(16, 185, 129, 0.65)' : 'rgba(255, 255, 255, 0.35)'}
        strokeWidth={3}
        strokeLinecap='round'
        strokeDasharray='48 192'
        className='animate-flow-beam'
        style={{
          filter: `drop-shadow(0 0 6px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 14px rgba(16, 185, 129, 0.5))`,
        }}
      />

      {/* ─── Layer 3: High-contrast core photon beam ─── */}
      <path
        d={d}
        fill='none'
        stroke='#ffffff'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeDasharray='28 212'
        className='animate-flow-beam'
      />

      {/* ─── Layer 4: Continuous traveling light packet (native SVG motion) ─── */}
      <circle r={6} fill='rgba(16, 185, 129, 0.35)'>
        <animateMotion path={d} dur='2.6s' repeatCount='indefinite' />
      </circle>
      <circle r={2.5} fill='#ffffff'>
        <animateMotion path={d} dur='2.6s' repeatCount='indefinite' />
      </circle>

      {/* ─── Layer 5: Start Anchor Portal (Origin) ─── */}
      <circle
        cx={x1}
        cy={y1}
        r={5}
        fill='none'
        stroke='rgba(255, 255, 255, 0.35)'
        strokeWidth={1}
        className='animate-ping'
        style={{ animationDuration: '2.6s' }}
      />
      <circle
        cx={x1}
        cy={y1}
        r={3}
        fill={isActive ? '#ffffff' : '#242930'}
        stroke={isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'}
        strokeWidth={1}
      />
      <circle cx={x1} cy={y1} r={1.5} fill='#ffffff' />

      {/* ─── Layer 6: End Anchor Portal (Destination) ─── */}
      <circle
        cx={x2}
        cy={y2}
        r={5}
        fill='none'
        stroke='rgba(16, 185, 129, 0.4)'
        strokeWidth={1}
        className='animate-ping'
        style={{ animationDuration: '2.6s' }}
      />
      <circle
        cx={x2}
        cy={y2}
        r={3}
        fill={isActive ? '#ffffff' : '#242930'}
        stroke={isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'}
        strokeWidth={1}
      />
      <circle cx={x2} cy={y2} r={1.5} fill='#10b981' />

      {/* ─── Layer 7: Central Technical Telemetry Badge ─── */}
      <g transform={`translate(${midX}, ${midY})`}>
        {/* Badge backing plate */}
        <rect
          x={-56}
          y={-11}
          width={112}
          height={22}
          fill='#090B0E'
          stroke={isActive ? '#ffffff' : '#242930'}
          strokeWidth={1}
          rx={2}
          style={{
            filter: isActive
              ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))'
              : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))',
          }}
        />

        {/* Live status pulse glyph */}
        <circle
          cx={-44}
          cy={0}
          r={2}
          fill='#10b981'
          className='animate-pulse'
        />

        {/* Badge technical label */}
        <text
          x={3}
          y={3}
          textAnchor='middle'
          fill={isActive ? '#F3F4F6' : '#C4C8CE'}
          fontSize='8'
          fontFamily='ui-monospace, monospace'
          letterSpacing='0.12em'
          fontWeight='700'
        >
          {label}
        </text>
      </g>
    </g>
  );
}

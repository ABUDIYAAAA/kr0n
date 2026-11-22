'use client';

export default function Kr0nMark({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
      className={className}
    >
      <rect
        x='3'
        y='3'
        width='18'
        height='18'
        rx='2'
        stroke='currentColor'
        strokeWidth='1.75'
      />
      <path
        d='M8 16L16 8'
        stroke='#4A8AD6'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <rect x='7.25' y='7.25' width='3' height='3' fill='currentColor' />
      <rect x='13.75' y='13.75' width='3' height='3' fill='currentColor' />
    </svg>
  );
}

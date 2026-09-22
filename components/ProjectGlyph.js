import { Triangle } from "lucide-react";

export default function ProjectGlyph({ className = "" }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center border border-white/15 bg-white/[0.04] ${className}`}>
      <Triangle
        size={12}
        className="fill-white text-white"
        strokeWidth={1.5}
      />
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function DocsPagination({ prev = null, next = null }) {
  return (
    <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {prev ? (
        <Link
          href={prev.slug}
          className="group border border-white/10 bg-white/[0.02] p-5 hover:border-white/30 hover:bg-white/[0.04] transition-all flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            <span>PREVIOUS</span>
          </div>
          <span className="text-sm font-bold text-white group-hover:text-white/90">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={next.slug}
          className="group border border-white/10 bg-white/[0.02] p-5 hover:border-white/30 hover:bg-white/[0.04] transition-all flex flex-col justify-between items-end text-right sm:col-start-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
            <span>NEXT</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-sm font-bold text-white group-hover:text-white/90">
            {next.title}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

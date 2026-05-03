import { Bell, MoreHorizontal } from "lucide-react";

export default function RailUserFooter({
  username = "arpittripathi",
  plan = "Hobby",
}) {
  return (
    <div className="shrink-0 border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 border border-white/20 bg-white/5" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-white">{username}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/35">
            {plan}
          </div>
        </div>
        <button
          type="button"
          className="text-white/35 hover:text-white/60"
          aria-label="Account menu">
          <MoreHorizontal size={16} />
        </button>
        <button
          type="button"
          className="text-white/35 hover:text-white/60"
          aria-label="Notifications">
          <Bell size={16} />
        </button>
      </div>
    </div>
  );
}

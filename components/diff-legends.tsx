export default function DiffLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[14px] border border-[#EAEAEA] bg-white/80 px-3 py-2 text-[12px] text-[#4B5563] backdrop-blur-sm">
      <span className="font-medium text-[#111827]">Diff legend</span>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2 py-1">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span>Unchanged</span>
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F7C9D0] bg-rose-50 px-2 py-1 text-rose-900">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span>Removed from left</span>
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFE7CC] bg-emerald-50 px-2 py-1 text-emerald-900">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span>Added on right</span>
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F4DE9A] bg-amber-50 px-2 py-1 text-amber-900">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span>Replacement (hover to match)</span>
      </span>
    </div>
  );
}
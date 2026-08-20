'use client';

interface Props {
  data: { label: string; value: number }[]; // 24 entries, label = hour "0".."23"
}

export default function HourHeatmap({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (!data || data.length === 0) {
    return <div className="text-sm text-ink/40 flex items-center justify-center h-[140px]">No data for this range.</div>;
  }

  return (
    <div className="py-1">
      <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-24 gap-1.5">
        {data.map((d) => {
          const intensity = d.value / max; // 0..1
          const bg = `rgba(224, 103, 46, ${0.08 + intensity * 0.85})`; // brand color ramp
          return (
            <div key={d.label} className="flex flex-col items-center gap-1 group" title={`${d.value.toLocaleString()} orders at ${d.label}:00`}>
              <div
                className="w-full aspect-square rounded-[6px] border border-ink/5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: bg }}
              />
              <span className="text-2xs text-ink/45 tabular-nums">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-2xs text-ink/40">
        <span>Fewer orders</span>
        <div className="flex gap-0.5">
          {[0.15, 0.35, 0.55, 0.75, 0.95].map((i) => (
            <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(224, 103, 46, ${i})` }} />
          ))}
        </div>
        <span>More orders</span>
      </div>
    </div>
  );
}

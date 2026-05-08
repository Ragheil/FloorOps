function SummaryCard({ label, value, icon: Icon, accentClass = "bg-slate-900 text-white" }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>

        <div className={`rounded-2xl p-3 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default SummaryCard;

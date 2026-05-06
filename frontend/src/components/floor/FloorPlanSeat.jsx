import { FileText, PencilLine, Plus } from "lucide-react";
import { getStatusStyle } from "../../utils/statusStyles";

function FloorPlanSeat({ seat, station, muted = false, onClick }) {
  const isConfigured = Boolean(station);
  const status = station?.status || "Vacant";
  const style = getStatusStyle(status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-28 w-[5.9rem] shrink-0 flex-col justify-between rounded-[1.4rem] border bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-panel ${
        isConfigured ? style.border : "border-dashed border-slate-300"
      } ${muted ? "opacity-30 saturate-50" : "opacity-100"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-400">{seat.bayName}</span>
        {station?.notes ? <FileText className="h-3.5 w-3.5 text-accent" /> : <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />}
      </div>

      <div>
        <p className="font-display text-base font-bold tracking-tight text-slate-950">{seat.label}</p>
        <p className="mt-1 truncate text-[0.68rem] text-slate-500">{station?.pc_name || `FOPS-${seat.label}`}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[0.62rem] font-semibold ring-1 ring-inset ${
            isConfigured ? style.badge : "bg-slate-100 text-slate-500 ring-slate-200"
          }`}
        >
          {isConfigured ? status : "Setup"}
        </span>

        {isConfigured ? (
          <PencilLine className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-slate-700" />
        ) : (
          <Plus className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-slate-700" />
        )}
      </div>
    </button>
  );
}

export default FloorPlanSeat;

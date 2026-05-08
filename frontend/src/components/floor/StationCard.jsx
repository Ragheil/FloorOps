import { FileText, Laptop, PencilLine, User2, Wifi } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import { getStatusStyle } from "../../utils/statusStyles";

function StationCard({ station, onEdit }) {
  const style = getStatusStyle(station.status);

  return (
    <article className={`rounded-[1.5rem] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Seat</p>
          <h3 className="mt-1 font-display text-xl font-bold text-slate-950">{station.seat_label}</h3>
        </div>
        <StatusBadge status={station.status} />
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <Laptop className="h-4 w-4 text-slate-400" />
          <span>{station.pc_name || "No PC assigned"}</span>
        </div>
        <div className="flex items-center gap-3">
          <User2 className="h-4 w-4 text-slate-400" />
          <span>{station.agent_name || "Unassigned agent"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Wifi className="h-4 w-4 text-slate-400" />
          <span>{station.ip_address || "No IP recorded"}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          {station.notes ? (
            <>
              <FileText className="h-4 w-4 text-accent" />
              <span>Notes added</span>
            </>
          ) : (
            <span>No notes</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEdit(station)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <PencilLine className="h-4 w-4" />
          Assign/Edit
        </button>
      </div>

      {station.notes ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">{station.notes}</div>
      ) : null}
    </article>
  );
}

export default StationCard;

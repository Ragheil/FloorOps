import { Plus, Rows3 } from "lucide-react";
import EmptyState from "../common/EmptyState";
import StationCard from "./StationCard";

function BayCard({ bay, stations, onEditStation, onAddStation }) {
  return (
    <section className="rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Rows3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-950">{bay.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{bay.description || "No description added for this bay."}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-950">{stations.length}</span> station{stations.length === 1 ? "" : "s"}
          </div>
          <button
            type="button"
            onClick={() => onAddStation(bay.id)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Seat
          </button>
        </div>
      </div>

      {stations.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} onEdit={onEditStation} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="No stations match this view"
            description="Adjust the current filters or add a new seat to start using this bay."
            actionLabel="Add Seat"
            onAction={() => onAddStation(bay.id)}
          />
        </div>
      )}
    </section>
  );
}

export default BayCard;

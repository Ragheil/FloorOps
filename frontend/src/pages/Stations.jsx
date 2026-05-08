import { useEffect, useState } from "react";
import { FileSearch, PencilLine, Plus, Trash2 } from "lucide-react";
import client from "../api/client";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import ExportButton from "../components/common/ExportButton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatusBadge from "../components/common/StatusBadge";
import StationModal from "../components/floor/StationModal";
import SearchBar from "../components/filters/SearchBar";
import useFloorUpdates from "../hooks/useFloorUpdates";
import { downloadCsv } from "../utils/csv";

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error.message || fallback;

const matchesSearch = (station, search) => {
  if (!search.trim()) {
    return true;
  }

  const term = search.trim().toLowerCase();
  return [station.agent_name, station.agent_id, station.pc_name, station.ip_address, station.seat_label].some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(term)
  );
};

function Stations({ viewMode = "stations" }) {
  const [bays, setBays] = useState([]);
  const [stations, setStations] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    bayId: "All",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [stationDraft, setStationDraft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setErrorMessage("");
    }

    try {
      const [baysResponse, stationsResponse] = await Promise.all([client.get("/bays"), client.get("/stations")]);
      setErrorMessage("");
      setBays(baysResponse.data.data || []);
      setStations(stationsResponse.data.data || []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load stations."));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFloorUpdates({
    onUpdate: () => fetchData({ silent: true }),
    paused: modalOpen || confirmOpen,
  });

  const sortedBays = [...bays].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));

  const filteredStations = [...stations]
    .filter((station) => {
      if (filters.status !== "All" && station.status !== filters.status) {
        return false;
      }

      if (filters.bayId !== "All" && station.bay_id !== filters.bayId) {
        return false;
      }

      return matchesSearch(station, filters.search);
    })
    .sort((a, b) => {
      const baySortDelta = (a.bay?.sort_order || 0) - (b.bay?.sort_order || 0);
      if (baySortDelta !== 0) {
        return baySortDelta;
      }

      const seatSortDelta = (a.sort_order || 0) - (b.sort_order || 0);
      if (seatSortDelta !== 0) {
        return seatSortDelta;
      }

      return a.seat_label.localeCompare(b.seat_label);
    });

  const openCreateModal = () => {
    const defaultBay = sortedBays[0]?.id || "";
    const nextSortOrder = stations.filter((station) => station.bay_id === defaultBay).length + 1;

    setStationDraft({
      bay_id: defaultBay,
      status: "Vacant",
      sort_order: nextSortOrder,
    });
    setActionError("");
    setModalOpen(true);
  };

  const openEditModal = (station) => {
    setStationDraft(station);
    setActionError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStationDraft(null);
    setActionError("");
  };

  const handleSaveStation = async (values) => {
    setSubmitting(true);
    setActionError("");

    try {
      if (stationDraft?.id) {
        await client.put(`/stations/${stationDraft.id}`, values);
      } else {
        await client.post("/stations", values);
      }

      closeModal();
      await fetchData({ silent: true });
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to save station."));
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (station) => {
    setStationToDelete(station);
    setActionError("");
    setConfirmOpen(true);
  };

  const handleDeleteStation = async () => {
    if (!stationToDelete) {
      return;
    }

    setDeleting(true);
    setActionError("");

    try {
      await client.delete(`/stations/${stationToDelete.id}`);
      setConfirmOpen(false);
      setStationToDelete(null);
      await fetchData({ silent: true });
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to delete station."));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setActionError("");

    try {
      const params = {};

      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }

      if (filters.status !== "All") {
        params.status = filters.status;
      }

      if (filters.bayId !== "All") {
        params.bay_id = filters.bayId;
      }

      const response = await client.get("/export/stations", { params });
      const rows = (response.data.data || []).map((row) => ({
        Bay: row.bay,
        "Seat Label": row.seatLabel,
        "PC Name": row.pcName,
        "IP Address": row.ipAddress,
        "Agent Name": row.agentName,
        "Agent ID": row.agentId,
        Status: row.status,
        Notes: row.notes,
        "Updated At": row.updatedAt,
      }));

      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(rows, `floorops-seating-list-${stamp}.csv`);
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to export seating list."));
    } finally {
      setExporting(false);
    }
  };

  const isExportView = viewMode === "export";

  if (loading) {
    return <LoadingSpinner label={isExportView ? "Preparing export preview..." : "Loading stations..."} />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            {isExportView ? "Snapshot and export" : "Detailed directory"}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">
            {isExportView ? "Export Seating List" : "All Stations"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            {isExportView
              ? "Review the current floor assignments, apply filters, and export only the seats you want to share."
              : "Use the table view for precise edits, quick lookup, and station cleanup across every bay."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ExportButton onClick={handleExport} loading={exporting} />
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            <Plus className="h-4 w-4" />
            Add Station
          </button>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchBar
            value={filters.search}
            onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
            onClear={() => setFilters((current) => ({ ...current, search: "" }))}
            placeholder="Search by agent, ID, PC, IP, or seat"
          />

          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:w-48"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Vacant">Vacant</option>
            <option value="Issue">Issue</option>
            <option value="Reserved">Reserved</option>
          </select>

          <select
            value={filters.bayId}
            onChange={(event) => setFilters((current) => ({ ...current, bayId: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 lg:w-56"
          >
            <option value="All">All Bays</option>
            {sortedBays.map((bay) => (
              <option key={bay.id} value={bay.id}>
                {bay.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}

      {filteredStations.length ? (
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-5 py-4">Bay</th>
                  <th className="px-5 py-4">Seat Label</th>
                  <th className="px-5 py-4">PC Name</th>
                  <th className="px-5 py-4">IP Address</th>
                  <th className="px-5 py-4">Agent</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Notes</th>
                  <th className="px-5 py-4">Updated At</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStations.map((station) => (
                  <tr key={station.id} className="align-top text-sm text-slate-600">
                    <td className="px-5 py-4 font-semibold text-slate-900">{station.bay?.name || "Unassigned"}</td>
                    <td className="px-5 py-4">{station.seat_label}</td>
                    <td className="px-5 py-4">{station.pc_name || "—"}</td>
                    <td className="px-5 py-4">{station.ip_address || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{station.agent_name || "Unassigned"}</div>
                      <div className="mt-1 text-xs text-slate-500">{station.agent_id || "No ID"}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={station.status} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs whitespace-pre-wrap text-sm text-slate-500">{station.notes || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {station.updated_at ? new Date(station.updated_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(station)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDelete(station)}
                          className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={FileSearch}
          title="No stations found"
          description="Try changing the filters, or add a new station to start building your floor map."
          actionLabel={sortedBays.length ? "Add Station" : undefined}
          onAction={sortedBays.length ? openCreateModal : undefined}
        />
      )}

      <StationModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSaveStation}
        bays={sortedBays}
        initialData={stationDraft}
        submitting={submitting}
        errorMessage={actionError}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this station?"
        description={`This will permanently remove ${stationToDelete?.seat_label || "this station"} from the floor map.`}
        confirmLabel="Delete Station"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteStation}
        loading={deleting}
      />
    </div>
  );
}

export default Stations;

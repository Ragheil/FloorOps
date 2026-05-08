import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, MapPinned, Plus, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SummaryCard from "../components/common/SummaryCard";
import BayCard from "../components/floor/BayCard";
import StationModal from "../components/floor/StationModal";
import SearchBar from "../components/filters/SearchBar";
import useFloorUpdates from "../hooks/useFloorUpdates";

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

function Dashboard() {
  const navigate = useNavigate();
  const [bays, setBays] = useState([]);
  const [stations, setStations] = useState([]);
  const [summary, setSummary] = useState({
    totalSeats: 0,
    active: 0,
    vacant: 0,
    issue: 0,
    reserved: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    bayId: "All",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [stationDraft, setStationDraft] = useState(null);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setErrorMessage("");
    }

    try {
      const [baysResponse, stationsResponse, summaryResponse] = await Promise.all([
        client.get("/bays"),
        client.get("/stations"),
        client.get("/dashboard/summary"),
      ]);

      setErrorMessage("");
      setBays(baysResponse.data.data || []);
      setStations(stationsResponse.data.data || []);
      setSummary(summaryResponse.data.data || {});
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to load dashboard data."));
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
    paused: modalOpen,
  });

  const openCreateStation = (bayId = "") => {
    const fallbackBay = bayId || bays[0]?.id || "";
    const nextSortOrder = stations.filter((station) => station.bay_id === fallbackBay).length + 1;

    setStationDraft({
      bay_id: fallbackBay,
      status: "Vacant",
      sort_order: nextSortOrder,
    });
    setModalError("");
    setModalOpen(true);
  };

  const openEditStation = (station) => {
    setStationDraft(station);
    setModalError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStationDraft(null);
    setModalError("");
  };

  const handleSaveStation = async (values) => {
    setSubmitting(true);
    setModalError("");

    try {
      if (stationDraft?.id) {
        await client.put(`/stations/${stationDraft.id}`, values);
      } else {
        await client.post("/stations", values);
      }

      closeModal();
      await fetchData({ silent: true });
    } catch (error) {
      setModalError(getErrorMessage(error, "Failed to save station."));
    } finally {
      setSubmitting(false);
    }
  };

  const sortedBays = [...bays].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  const filteredStations = stations.filter((station) => {
    if (filters.status !== "All" && station.status !== filters.status) {
      return false;
    }

    if (filters.bayId !== "All" && station.bay_id !== filters.bayId) {
      return false;
    }

    return matchesSearch(station, filters.search);
  });

  const hasActiveFilters = Boolean(filters.search.trim()) || filters.status !== "All" || filters.bayId !== "All";

  const summaryCards = [
    { label: "Total Seats", value: summary.totalSeats || 0, icon: MapPinned, accentClass: "bg-slate-900 text-white" },
    { label: "Active", value: summary.active || 0, icon: CheckCircle2, accentClass: "bg-emerald-500 text-white" },
    { label: "Vacant", value: summary.vacant || 0, icon: CircleDashed, accentClass: "bg-slate-500 text-white" },
    { label: "Issue", value: summary.issue || 0, icon: AlertTriangle, accentClass: "bg-rose-500 text-white" },
    { label: "Reserved", value: summary.reserved || 0, icon: UserCheck, accentClass: "bg-amber-500 text-white" },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading floor map..." />;
  }

  if (!bays.length) {
    return (
      <EmptyState
        icon={MapPinned}
        title="No bays yet"
        description="Create your first bay so the floor map has somewhere to place stations and assignments."
        actionLabel="Go to Bay Management"
        onAction={() => navigate("/bays")}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Operations overview</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">Visual Station Assignment Board</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Review every bay, spot open seats quickly, and make assignment changes without leaving the dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateStation()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add Station
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchBar
            value={filters.search}
            onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
            onClear={() => setFilters((current) => ({ ...current, search: "" }))}
            placeholder="Search agent, agent ID, PC, IP, or seat label"
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

      {hasActiveFilters && !filteredStations.length ? (
        <EmptyState
          icon={CircleDashed}
          title="No stations match the current filters"
          description="Try broadening the search or switching the status and bay filters to see more of the floor."
        />
      ) : (
        <section className="space-y-6">
          {sortedBays.map((bay) => {
            const bayStations = filteredStations
              .filter((station) => station.bay_id === bay.id)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.seat_label.localeCompare(b.seat_label));

            return (
              <BayCard
                key={bay.id}
                bay={bay}
                stations={bayStations}
                onEditStation={openEditStation}
                onAddStation={openCreateStation}
              />
            );
          })}
        </section>
      )}

      <StationModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSaveStation}
        bays={sortedBays}
        initialData={stationDraft}
        submitting={submitting}
        errorMessage={modalError}
      />
    </div>
  );
}

export default Dashboard;

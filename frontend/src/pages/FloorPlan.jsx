import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  GripHorizontal,
  LayoutGrid,
  MapPinned,
  PanelsTopLeft,
  Plus,
  Sparkles,
} from "lucide-react";
import client from "../api/client";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SummaryCard from "../components/common/SummaryCard";
import StationModal from "../components/floor/StationModal";
import SearchBar from "../components/filters/SearchBar";
import useFloorUpdates from "../hooks/useFloorUpdates";
import { getStatusStyle } from "../utils/statusStyles";

const UNASSIGNED_ZONE_ID = "__unassigned__";

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error.message || fallback;

const sortBays = (items) =>
  [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));

const sortStations = (items) =>
  [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.seat_label.localeCompare(b.seat_label));

const normalizeSortOrder = (items) => items.map((item, index) => ({ ...item, sort_order: index + 1 }));

const getDropPlacement = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const midpointX = rect.left + rect.width / 2;
  const midpointY = rect.top + rect.height / 2;

  return event.clientX > midpointX || event.clientY > midpointY ? "after" : "before";
};

const getZoneIdForStation = (station, baysById) =>
  station.bay_id && baysById.has(station.bay_id) ? station.bay_id : UNASSIGNED_ZONE_ID;

const matchesStation = ({ station, bayName, search, status }) => {
  const normalizedSearch = search.trim().toLowerCase();

  if (status !== "All" && station.status !== status) {
    return false;
  }

  if (!normalizedSearch) {
    return true;
  }

  return [
    station.seat_label,
    station.pc_name,
    station.ip_address,
    station.agent_name,
    station.agent_id,
    station.notes,
    station.status,
    bayName,
  ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
};

const buildStationCollections = (stations, baysById) => {
  const collections = new Map([...baysById.keys(), UNASSIGNED_ZONE_ID].map((key) => [key, []]));

  for (const station of sortStations(stations)) {
    const zoneId = getZoneIdForStation(station, baysById);
    collections.get(zoneId).push({ ...station });
  }

  return collections;
};

const buildNextStationState = ({
  stations,
  baysById,
  stationId,
  targetZoneId,
  targetStationId = null,
  placement = "after",
}) => {
  const collections = buildStationCollections(stations, baysById);

  let sourceZoneId = null;
  let draggedStation = null;

  for (const [zoneId, items] of collections.entries()) {
    const match = items.find((item) => item.id === stationId);
    if (match) {
      sourceZoneId = zoneId;
      draggedStation = match;
      break;
    }
  }

  if (!sourceZoneId || !draggedStation) {
    return null;
  }

  if (sourceZoneId !== UNASSIGNED_ZONE_ID && targetZoneId === UNASSIGNED_ZONE_ID) {
    return null;
  }

  if (stationId === targetStationId) {
    return null;
  }

  const sourceItems = collections.get(sourceZoneId);
  const draggedIndex = sourceItems.findIndex((item) => item.id === stationId);
  sourceItems.splice(draggedIndex, 1);

  const targetItems = collections.get(targetZoneId);
  if (!targetItems) {
    return null;
  }

  let insertIndex = targetItems.length;
  if (targetStationId) {
    const targetIndex = targetItems.findIndex((item) => item.id === targetStationId);
    if (targetIndex >= 0) {
      insertIndex = targetIndex + (placement === "after" ? 1 : 0);
    }
  }

  targetItems.splice(insertIndex, 0, {
    ...draggedStation,
    bay_id: targetZoneId === UNASSIGNED_ZONE_ID ? draggedStation.bay_id : targetZoneId,
    bay: targetZoneId === UNASSIGNED_ZONE_ID ? draggedStation.bay : baysById.get(targetZoneId) || draggedStation.bay,
  });

  const updates = new Map();
  for (const [zoneId, items] of collections.entries()) {
    items.forEach((item, index) => {
      updates.set(item.id, {
        ...item,
        sort_order: index + 1,
        bay_id: zoneId === UNASSIGNED_ZONE_ID ? item.bay_id : zoneId,
        bay: zoneId === UNASSIGNED_ZONE_ID ? item.bay : baysById.get(zoneId) || item.bay,
      });
    });
  }

  return stations.map((station) => updates.get(station.id) || station);
};

const buildNextBayState = ({ bays, sourceBayId, targetBayId, placement = "after" }) => {
  if (sourceBayId === targetBayId) {
    return null;
  }

  const ordered = normalizeSortOrder(sortBays(bays));
  const sourceIndex = ordered.findIndex((bay) => bay.id === sourceBayId);
  if (sourceIndex < 0) {
    return null;
  }

  const [draggedBay] = ordered.splice(sourceIndex, 1);
  const targetIndex = ordered.findIndex((bay) => bay.id === targetBayId);
  if (targetIndex < 0) {
    return null;
  }

  const insertIndex = targetIndex + (placement === "after" ? 1 : 0);
  ordered.splice(insertIndex, 0, draggedBay);

  return normalizeSortOrder(ordered);
};

function StationTile({
  station,
  bayName,
  muted,
  dragging,
  dropTarget,
  draggingDisabled,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const style = getStatusStyle(station.status);

  return (
    <button
      type="button"
      draggable={!draggingDisabled}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group flex h-24 w-[5.9rem] shrink-0 flex-col justify-between rounded-[1.35rem] border bg-white p-3 text-left shadow-sm transition ${
        style.border
      } ${muted ? "opacity-35 saturate-50" : "opacity-100"} ${
        dragging ? "scale-95 opacity-40" : "hover:-translate-y-1 hover:shadow-panel"
      } ${dropTarget ? "ring-2 ring-accent ring-offset-2" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
        {station.notes ? <FileText className="h-3.5 w-3.5 text-accent" /> : null}
      </div>

      <div>
        <p className="font-display text-sm font-bold tracking-tight text-slate-950">{station.seat_label}</p>
        <p className="mt-1 truncate text-[0.68rem] text-slate-500">{station.pc_name || "No PC name"}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[0.62rem] font-semibold ring-1 ring-inset ${style.badge}`}
        >
          {station.status}
        </span>
        <span className="truncate text-[0.6rem] uppercase tracking-[0.16em] text-slate-400">{bayName}</span>
      </div>
    </button>
  );
}

function BayPanel({
  bay,
  stations,
  matchedStationIds,
  activeDropTarget,
  isUnassigned = false,
  bayDropTarget = false,
  zoneDropTarget = false,
  draggingBay = false,
  onAddStation,
  onOpenStation,
  onBayDragStart,
  onBayDragEnd,
  onBayDragOver,
  onBayDrop,
  onZoneDragOver,
  onZoneDrop,
  onStationDragStart,
  onStationDragEnd,
  onStationDragOver,
  onStationDrop,
  draggingStationId,
  draggingDisabled,
}) {
  const matchedCount = stations.filter((station) => matchedStationIds.has(station.id)).length;

  return (
    <section
      onDragOver={onBayDragOver}
      onDrop={onBayDrop}
      className={`rounded-[1.85rem] border bg-slate-50/80 p-4 shadow-sm transition ${
        bayDropTarget ? "border-accent bg-accentSoft/25" : isUnassigned ? "border-amber-200" : "border-slate-200"
      } ${draggingBay ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {!isUnassigned ? (
              <button
                type="button"
                draggable={!draggingDisabled}
                onDragStart={onBayDragStart}
                onDragEnd={onBayDragEnd}
                className="inline-flex cursor-grab items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 active:cursor-grabbing"
                aria-label={`Drag ${bay.name}`}
              >
                <GripHorizontal className="h-4 w-4" />
              </button>
            ) : null}

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {isUnassigned ? "Recovery tray" : `Sort ${bay.sort_order || 0}`}
              </p>
              <h2 className="mt-1 truncate font-display text-2xl font-bold text-slate-950">{bay.name}</h2>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {isUnassigned
              ? "These PCs do not currently belong to a valid bay. Drag them into a real bay to fix the floor plan."
              : bay.description || "Drop PCs here, then drag them around until the bay matches your preferred arrangement."}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">PCs</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-950">{stations.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {matchedCount === stations.length ? "All visible" : `${matchedCount} match current filter`}
            </p>
          </div>

          {!isUnassigned ? (
            <button
              type="button"
              onClick={onAddStation}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add PC
            </button>
          ) : null}
        </div>
      </div>

      <div
        onDragOver={onZoneDragOver}
        onDrop={onZoneDrop}
        className={`mt-5 rounded-[1.5rem] border border-dashed p-4 transition ${
          zoneDropTarget ? "border-accent bg-accentSoft/20" : "border-slate-200 bg-white/85"
        }`}
      >
        {stations.length ? (
          <div className="flex min-h-[7rem] flex-wrap gap-3">
            {stations.map((station) => (
              <StationTile
                key={station.id}
                station={station}
                bayName={isUnassigned ? "Needs Bay" : bay.name}
                muted={!matchedStationIds.has(station.id)}
                dragging={draggingStationId === station.id}
                dropTarget={activeDropTarget === `station:${station.id}`}
                draggingDisabled={draggingDisabled}
                onClick={() => onOpenStation(station)}
                onDragStart={(event) => onStationDragStart(event, station)}
                onDragEnd={onStationDragEnd}
                onDragOver={(event) => onStationDragOver(event, station)}
                onDrop={(event) => onStationDrop(event, station)}
              />
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onAddStation}
            className="flex min-h-[7rem] w-full flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-slate-200 px-4 py-6 text-center transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Plus className="h-5 w-5 text-slate-400" />
            <span className="mt-3 text-sm font-semibold text-slate-700">Add the first PC in this bay</span>
            <span className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">or drag one here</span>
          </button>
        )}
      </div>
    </section>
  );
}

function FloorPlan() {
  const [bays, setBays] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [stationDraft, setStationDraft] = useState(null);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

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
      setErrorMessage(getErrorMessage(error, "Failed to load the floor plan."));
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
    paused: modalOpen || layoutSaving || Boolean(dragState),
  });

  const sortedBays = useMemo(() => sortBays(bays), [bays]);
  const baysById = useMemo(() => new Map(sortedBays.map((bay) => [bay.id, bay])), [sortedBays]);

  const stationsByZone = useMemo(() => {
    const collections = buildStationCollections(stations, baysById);
    return collections;
  }, [stations, baysById]);

  const unassignedStations = stationsByZone.get(UNASSIGNED_ZONE_ID) || [];

  const matchedStationIds = useMemo(() => {
    const matches = new Set();

    for (const station of stations) {
      const zoneId = getZoneIdForStation(station, baysById);
      const bayName = zoneId === UNASSIGNED_ZONE_ID ? "Needs Bay" : baysById.get(zoneId)?.name || "";

      if (
        matchesStation({
          station,
          bayName,
          search: filters.search,
          status: filters.status,
        })
      ) {
        matches.add(station.id);
      }
    }

    return matches;
  }, [stations, baysById, filters.search, filters.status]);

  const counts = stations.reduce(
    (accumulator, station) => {
      if (station.status === "Active") accumulator.active += 1;
      if (station.status === "Vacant") accumulator.vacant += 1;
      if (station.status === "Issue") accumulator.issue += 1;
      if (station.status === "Reserved") accumulator.reserved += 1;
      return accumulator;
    },
    { active: 0, vacant: 0, issue: 0, reserved: 0 }
  );

  const summaryCards = [
    { label: "Bays", value: sortedBays.length, icon: LayoutGrid, accentClass: "bg-slate-900 text-white" },
    { label: "Total PCs", value: stations.length, icon: PanelsTopLeft, accentClass: "bg-slate-700 text-white" },
    { label: "Active", value: counts.active, icon: CheckCircle2, accentClass: "bg-emerald-500 text-white" },
    { label: "Issue", value: counts.issue, icon: AlertTriangle, accentClass: "bg-rose-500 text-white" },
  ];

  const clearDragState = () => {
    setDragState(null);
    setDropTarget(null);
  };

  const openCreateStation = (bayId = sortedBays[0]?.id || "") => {
    if (!bayId) {
      return;
    }

    const currentBayStations = sortStations(stations.filter((station) => station.bay_id === bayId));

    setStationDraft({
      bay_id: bayId,
      seat_label: "",
      pc_name: "",
      ip_address: "",
      agent_name: "",
      agent_id: "",
      status: "Vacant",
      notes: "",
      sort_order: currentBayStations.length + 1,
    });
    setModalError("");
    setModalOpen(true);
  };

  const openStationModal = (station) => {
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

  const persistBayOrder = async (nextBays) => {
    const previousBays = bays;
    const previousById = new Map(previousBays.map((bay) => [bay.id, bay]));
    const changedBays = nextBays.filter((bay) => (previousById.get(bay.id)?.sort_order || 0) !== (bay.sort_order || 0));

    if (!changedBays.length) {
      clearDragState();
      return;
    }

    setLayoutSaving(true);
    setErrorMessage("");
    setBays(nextBays);

    try {
      await Promise.all(
        changedBays.map((bay) =>
          client.put(`/bays/${bay.id}`, {
            sort_order: bay.sort_order,
          })
        )
      );
    } catch (error) {
      setBays(previousBays);
      setErrorMessage(getErrorMessage(error, "Failed to save bay arrangement."));
      await fetchData({ silent: true });
    } finally {
      setLayoutSaving(false);
      clearDragState();
    }
  };

  const persistStationOrder = async (nextStations) => {
    const previousStations = stations;
    const previousById = new Map(previousStations.map((station) => [station.id, station]));
    const changedStations = nextStations.filter((station) => {
      const previous = previousById.get(station.id);
      if (!previous) {
        return false;
      }

      return previous.bay_id !== station.bay_id || (previous.sort_order || 0) !== (station.sort_order || 0);
    });

    if (!changedStations.length) {
      clearDragState();
      return;
    }

    setLayoutSaving(true);
    setErrorMessage("");
    setStations(nextStations);

    try {
      await Promise.all(
        changedStations.map((station) =>
          client.put(`/stations/${station.id}`, {
            bay_id: station.bay_id,
            sort_order: station.sort_order,
          })
        )
      );
    } catch (error) {
      setStations(previousStations);
      setErrorMessage(getErrorMessage(error, "Failed to save PC arrangement."));
      await fetchData({ silent: true });
    } finally {
      setLayoutSaving(false);
      clearDragState();
    }
  };

  const handleBayDragStart = (event, bay) => {
    if (layoutSaving) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    setDragState({
      type: "bay",
      bayId: bay.id,
    });
  };

  const handleBayDragOver = (event, bay) => {
    if (dragState?.type !== "bay" || dragState.bayId === bay.id) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(`bay:${bay.id}`);
  };

  const handleBayDrop = async (event, bay) => {
    if (dragState?.type !== "bay" || dragState.bayId === bay.id) {
      return;
    }

    event.preventDefault();
    const placement = getDropPlacement(event);
    const nextBays = buildNextBayState({
      bays,
      sourceBayId: dragState.bayId,
      targetBayId: bay.id,
      placement,
    });

    if (!nextBays) {
      clearDragState();
      return;
    }

    await persistBayOrder(nextBays);
  };

  const handleStationDragStart = (event, station) => {
    if (layoutSaving) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    setDragState({
      type: "station",
      stationId: station.id,
      zoneId: getZoneIdForStation(station, baysById),
    });
  };

  const handleZoneDragOver = (event, zoneId) => {
    if (dragState?.type !== "station") {
      return;
    }

    if (zoneId === UNASSIGNED_ZONE_ID && dragState.zoneId !== UNASSIGNED_ZONE_ID) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(`zone:${zoneId}`);
  };

  const handleZoneDrop = async (event, zoneId) => {
    if (dragState?.type !== "station") {
      return;
    }

    if (zoneId === UNASSIGNED_ZONE_ID && dragState.zoneId !== UNASSIGNED_ZONE_ID) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextStations = buildNextStationState({
      stations,
      baysById,
      stationId: dragState.stationId,
      targetZoneId: zoneId,
    });

    if (!nextStations) {
      clearDragState();
      return;
    }

    await persistStationOrder(nextStations);
  };

  const handleStationDragOver = (event, station) => {
    if (dragState?.type !== "station" || dragState.stationId === station.id) {
      return;
    }

    const targetZoneId = getZoneIdForStation(station, baysById);
    if (targetZoneId === UNASSIGNED_ZONE_ID && dragState.zoneId !== UNASSIGNED_ZONE_ID) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(`station:${station.id}`);
  };

  const handleStationDrop = async (event, station) => {
    if (dragState?.type !== "station" || dragState.stationId === station.id) {
      return;
    }

    const targetZoneId = getZoneIdForStation(station, baysById);
    if (targetZoneId === UNASSIGNED_ZONE_ID && dragState.zoneId !== UNASSIGNED_ZONE_ID) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextStations = buildNextStationState({
      stations,
      baysById,
      stationId: dragState.stationId,
      targetZoneId,
      targetStationId: station.id,
      placement: getDropPlacement(event),
    });

    if (!nextStations) {
      clearDragState();
      return;
    }

    await persistStationOrder(nextStations);
  };

  if (loading) {
    return <LoadingSpinner label="Loading floor plan..." />;
  }

  if (!sortedBays.length && !stations.length) {
    return (
      <EmptyState
        icon={MapPinned}
        title="No floor data available yet"
        description="Create a bay first, then add PCs. The floor plan will build itself automatically and stay draggable."
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Dynamic floor map</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">Interactive Floor Plan</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Every bay and every PC now renders directly from your live data. Drag bay cards to reorder the floor, then drag PCs between bays the same way you rearrange app icons.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {layoutSaving ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <Sparkles className="h-4 w-4" />
              Saving arrangement...
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => openCreateStation()}
            disabled={!sortedBays.length}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add PC
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            placeholder="Search PC label, bay, agent, IP, notes, or status"
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
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      {unassignedStations.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold text-amber-950">{unassignedStations.length}</span> station
          {unassignedStations.length === 1 ? "" : "s"} do not belong to a valid bay right now. They appear in the recovery tray below so you can drag them into place instead of losing them from the floor plan.
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Drag and arrange</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">Live bay board</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Drag a bay by its grip handle. Drag a PC tile into another bay or between PCs to reorder them. Bay cards grow automatically as you add more PCs.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-4 py-2 text-sm font-semibold text-accent">
            <Sparkles className="h-4 w-4" />
            Dynamic layout active
          </div>
        </div>

        <div className="mt-6 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
          {sortedBays.map((bay) => (
            <BayPanel
              key={bay.id}
              bay={bay}
              stations={stationsByZone.get(bay.id) || []}
              matchedStationIds={matchedStationIds}
              activeDropTarget={dropTarget}
              bayDropTarget={dropTarget === `bay:${bay.id}`}
              zoneDropTarget={dropTarget === `zone:${bay.id}`}
              draggingBay={dragState?.type === "bay" && dragState.bayId === bay.id}
              onAddStation={() => openCreateStation(bay.id)}
              onOpenStation={openStationModal}
              onBayDragStart={(event) => handleBayDragStart(event, bay)}
              onBayDragEnd={clearDragState}
              onBayDragOver={(event) => handleBayDragOver(event, bay)}
              onBayDrop={(event) => handleBayDrop(event, bay)}
              onZoneDragOver={(event) => handleZoneDragOver(event, bay.id)}
              onZoneDrop={(event) => handleZoneDrop(event, bay.id)}
              onStationDragStart={handleStationDragStart}
              onStationDragEnd={clearDragState}
              onStationDragOver={handleStationDragOver}
              onStationDrop={handleStationDrop}
              draggingStationId={dragState?.type === "station" ? dragState.stationId : null}
              draggingDisabled={layoutSaving}
            />
          ))}

          {unassignedStations.length ? (
            <BayPanel
              bay={{ id: UNASSIGNED_ZONE_ID, name: "Needs Bay" }}
              stations={unassignedStations}
              matchedStationIds={matchedStationIds}
              activeDropTarget={dropTarget}
              isUnassigned
              zoneDropTarget={dropTarget === `zone:${UNASSIGNED_ZONE_ID}`}
              draggingBay={false}
              onAddStation={() => {}}
              onOpenStation={openStationModal}
              onBayDragStart={() => {}}
              onBayDragEnd={clearDragState}
              onBayDragOver={() => {}}
              onBayDrop={() => {}}
              onZoneDragOver={(event) => handleZoneDragOver(event, UNASSIGNED_ZONE_ID)}
              onZoneDrop={(event) => handleZoneDrop(event, UNASSIGNED_ZONE_ID)}
              onStationDragStart={handleStationDragStart}
              onStationDragEnd={clearDragState}
              onStationDragOver={handleStationDragOver}
              onStationDrop={handleStationDrop}
              draggingStationId={dragState?.type === "station" ? dragState.stationId : null}
              draggingDisabled={layoutSaving}
            />
          ) : null}
        </div>
      </section>

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

export default FloorPlan;

import { useEffect, useState } from "react";
import { PencilLine, Plus, Trash2, Warehouse } from "lucide-react";
import client from "../api/client";
import BayModal from "../components/bays/BayModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import useFloorUpdates from "../hooks/useFloorUpdates";

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error.message || fallback;

function Bays() {
  const [bays, setBays] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [bayDraft, setBayDraft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bayToDelete, setBayToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      setErrorMessage(getErrorMessage(error, "Failed to load bays."));
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

  const openCreateModal = () => {
    setBayDraft(null);
    setActionError("");
    setModalOpen(true);
  };

  const openEditModal = (bay) => {
    setBayDraft(bay);
    setActionError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setBayDraft(null);
    setActionError("");
  };

  const handleSaveBay = async (values) => {
    setSubmitting(true);
    setActionError("");

    try {
      if (bayDraft?.id) {
        await client.put(`/bays/${bayDraft.id}`, values);
      } else {
        await client.post("/bays", values);
      }

      closeModal();
      await fetchData({ silent: true });
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to save bay."));
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (bay) => {
    setBayToDelete(bay);
    setActionError("");
    setConfirmOpen(true);
  };

  const handleDeleteBay = async () => {
    if (!bayToDelete) {
      return;
    }

    setDeleting(true);
    setActionError("");

    try {
      await client.delete(`/bays/${bayToDelete.id}`);
      setConfirmOpen(false);
      setBayToDelete(null);
      await fetchData({ silent: true });
    } catch (error) {
      setActionError(getErrorMessage(error, "Failed to delete bay."));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading bays..." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Floor structure</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">Manage Bays</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Add, edit, and sequence the floor sections that organize seats across your operation.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add Bay
        </button>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}

      {sortedBays.length ? (
        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {sortedBays.map((bay) => {
            const stationCount = stations.filter((station) => station.bay_id === bay.id).length;

            return (
              <article key={bay.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white">
                      <Warehouse className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{bay.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {bay.description || "No description has been added for this bay yet."}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Sort {bay.sort_order}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stations</p>
                    <p className="mt-1 font-display text-3xl font-bold text-slate-950">{stationCount}</p>
                  </div>
                  <p className="max-w-[10rem] text-right text-sm text-slate-500">
                    {stationCount
                      ? "Delete is blocked until all stations are removed from this bay."
                      : "This bay can be safely deleted if no longer needed."}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => openEditModal(bay)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => promptDelete(bay)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          icon={Warehouse}
          title="No bays created yet"
          description="Start by creating the first bay for your floor so stations can be grouped cleanly."
          actionLabel="Add Bay"
          onAction={openCreateModal}
        />
      )}

      <BayModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSaveBay}
        initialData={bayDraft}
        submitting={submitting}
        errorMessage={actionError}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this bay?"
        description={`This will permanently remove ${bayToDelete?.name || "this bay"} only if it has no stations.`}
        confirmLabel="Delete Bay"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteBay}
        loading={deleting}
      />
    </div>
  );
}

export default Bays;

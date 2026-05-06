import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ModalShell from "../common/ModalShell";
import { STATUS_OPTIONS } from "../../utils/statusStyles";

const getInitialForm = (station) => ({
  bay_id: station?.bay_id || station?.bay?.id || "",
  seat_label: station?.seat_label || "",
  pc_name: station?.pc_name || "",
  ip_address: station?.ip_address || "",
  agent_name: station?.agent_name || "",
  agent_id: station?.agent_id || "",
  status: station?.status || "Vacant",
  notes: station?.notes || "",
  sort_order: station?.sort_order ?? 0,
});

function StationModal({ open, onClose, onSubmit, bays, initialData, submitting = false, errorMessage = "" }) {
  const [form, setForm] = useState(getInitialForm(initialData));

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(initialData));
    }
  }, [open, initialData]);

  if (!open) {
    return null;
  }

  const isEditing = Boolean(initialData?.id);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      sort_order: Number(form.sort_order) || 0,
    });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">
              {isEditing ? "Update Station" : "Add Station"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Capture equipment details and keep the station status accurate. Agent details are optional.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(100vh-10rem)] space-y-6 overflow-y-auto px-6 py-6">
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Bay</span>
              <select
                name="bay_id"
                value={form.bay_id}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="">Select a bay</option>
                {bays.map((bay) => (
                  <option key={bay.id} value={bay.id}>
                    {bay.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Seat Label</span>
              <input
                type="text"
                name="seat_label"
                value={form.seat_label}
                onChange={handleChange}
                required
                placeholder="PC-01"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>PC Name</span>
              <input
                type="text"
                name="pc_name"
                value={form.pc_name}
                onChange={handleChange}
                placeholder="FOPS-PC-01"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>IP Address</span>
              <input
                type="text"
                name="ip_address"
                value={form.ip_address}
                onChange={handleChange}
                placeholder="10.10.1.1"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Agent Name (Optional)</span>
              <input
                type="text"
                name="agent_name"
                value={form.agent_name}
                onChange={handleChange}
                placeholder="Leave blank if not assigned"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Agent ID (Optional)</span>
              <input
                type="text"
                name="agent_id"
                value={form.agent_id}
                onChange={handleChange}
                placeholder="Leave blank if not assigned"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Sort Order</span>
              <input
                type="number"
                min="0"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Notes</span>
            <textarea
              rows="4"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add any issues, reservations, or equipment notes."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Station"}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

export default StationModal;

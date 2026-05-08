import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ModalShell from "../common/ModalShell";

const getInitialForm = (bay) => ({
  name: bay?.name || "",
  description: bay?.description || "",
  sort_order: bay?.sort_order ?? 0,
});

function BayModal({ open, onClose, onSubmit, initialData, submitting = false, errorMessage = "" }) {
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
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">{isEditing ? "Edit Bay" : "Add Bay"}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Keep the floor map organized with clear bay names, descriptions, and ordering.
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
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Bay 1"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Description</span>
              <textarea
                rows="4"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the purpose of this bay."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
              />
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
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Bay"}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

export default BayModal;

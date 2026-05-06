import ModalShell from "./ModalShell";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onClose,
  onConfirm,
  loading = false,
  variant = "danger",
}) {
  if (!open) {
    return null;
  }

  const confirmClasses =
    variant === "danger"
      ? "bg-accent text-white hover:bg-rose-700"
      : "bg-slate-900 text-white hover:bg-slate-800";

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="font-display text-2xl font-bold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${confirmClasses}`}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default ConfirmDialog;

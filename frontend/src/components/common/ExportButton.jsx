import { Download } from "lucide-react";

function ExportButton({ onClick, loading = false, label = "Export CSV" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Download className="h-4 w-4" />
      {loading ? "Preparing..." : label}
    </button>
  );
}

export default ExportButton;

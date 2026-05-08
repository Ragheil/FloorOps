export const STATUS_OPTIONS = ["Active", "Vacant", "Issue", "Reserved"];

export const statusStyles = {
  Active: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Vacant: {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  Issue: {
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  Reserved: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

export const getStatusStyle = (status = "Vacant") => statusStyles[status] || statusStyles.Vacant;
